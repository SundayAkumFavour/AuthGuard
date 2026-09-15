/*
# Create Anomaly Detection Schema

1. New Tables
- `login_events`: Stores login event records mimicking CMU Insider Threat dataset (user activity, login time, device, IP, PC, activity type)
  - id (uuid, PK)
  - user_id (text): the user identifier (e.g. "USR0001")
  - timestamp (timestamptz): when the event occurred
  - day_of_week (int): 0-6
  - hour_of_day (int): 0-23
  - pc_id (text): device/PC identifier
  - ip_address (text): IP address used for login
  - activity (text): type of activity (Logon, Logoff, HTTP, File, Email)
  - is_off_hours (boolean): whether login occurred outside business hours
  - is_weekend (boolean): whether login occurred on weekend
  - is_anomaly (boolean): ground truth label for anomaly
  - anomaly_score (float): computed anomaly score
  - created_at (timestamptz)
- `detected_anomalies`: Stores anomalies detected by the model
  - id (uuid, PK)
  - user_id (text): user involved
  - event_id (uuid, FK to login_events)
  - timestamp (timestamptz): when anomaly was detected
  - anomaly_score (float): model score
  - reason (text): human-readable explanation
  - features (jsonb): feature snapshot at detection time
  - severity (text): low/medium/high/critical
  - status (text): open/investigated/resolved
  - created_at (timestamptz)
- `alerts`: Real-time alert notifications
  - id (uuid, PK)
  - user_id (text): user involved
  - anomaly_id (uuid, FK to detected_anomalies)
  - timestamp (timestamptz)
  - message (text): alert message
  - severity (text): low/medium/high/critical
  - acknowledged (boolean, default false)
  - created_at (timestamptz)
- `model_metrics`: Stores model evaluation metrics over time
  - id (uuid, PK)
  - model_name (text): name of the model
  - accuracy (float)
  - precision (float)
  - recall (float)
  - f1_score (float)
  - roc_auc (float)
  - false_positives (int)
  - false_negatives (int)
  - true_positives (int)
  - true_negatives (int)
  - trained_at (timestamptz)
  - created_at (timestamptz)
2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD (single-tenant, no auth app).
3. Indexes
- login_events: user_id, timestamp, is_anomaly
- detected_anomalies: user_id, timestamp, severity, status
- alerts: user_id, timestamp, acknowledged
- model_metrics: model_name, trained_at
*/

CREATE TABLE IF NOT EXISTS login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  timestamp timestamptz NOT NULL,
  day_of_week int NOT NULL,
  hour_of_day int NOT NULL,
  pc_id text NOT NULL,
  ip_address text NOT NULL,
  activity text NOT NULL DEFAULT 'Logon',
  is_off_hours boolean NOT NULL DEFAULT false,
  is_weekend boolean NOT NULL DEFAULT false,
  is_anomaly boolean NOT NULL DEFAULT false,
  anomaly_score float DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_timestamp ON login_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_login_events_is_anomaly ON login_events(is_anomaly);

ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_login_events" ON login_events;
CREATE POLICY "anon_select_login_events" ON login_events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_login_events" ON login_events;
CREATE POLICY "anon_insert_login_events" ON login_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_login_events" ON login_events;
CREATE POLICY "anon_update_login_events" ON login_events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_login_events" ON login_events;
CREATE POLICY "anon_delete_login_events" ON login_events FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS detected_anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  event_id uuid REFERENCES login_events(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  anomaly_score float NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  features jsonb DEFAULT '{}',
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_detected_anomalies_user_id ON detected_anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_detected_anomalies_timestamp ON detected_anomalies(timestamp);
CREATE INDEX IF NOT EXISTS idx_detected_anomalies_severity ON detected_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_detected_anomalies_status ON detected_anomalies(status);

ALTER TABLE detected_anomalies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_detected_anomalies" ON detected_anomalies;
CREATE POLICY "anon_select_detected_anomalies" ON detected_anomalies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_detected_anomalies" ON detected_anomalies;
CREATE POLICY "anon_insert_detected_anomalies" ON detected_anomalies FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_detected_anomalies" ON detected_anomalies;
CREATE POLICY "anon_update_detected_anomalies" ON detected_anomalies FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_detected_anomalies" ON detected_anomalies;
CREATE POLICY "anon_delete_detected_anomalies" ON detected_anomalies FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  anomaly_id uuid REFERENCES detected_anomalies(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  message text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'medium',
  acknowledged boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_alerts" ON alerts;
CREATE POLICY "anon_select_alerts" ON alerts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_alerts" ON alerts;
CREATE POLICY "anon_insert_alerts" ON alerts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_alerts" ON alerts;
CREATE POLICY "anon_update_alerts" ON alerts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_alerts" ON alerts;
CREATE POLICY "anon_delete_alerts" ON alerts FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS model_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  accuracy float NOT NULL DEFAULT 0,
  precision float NOT NULL DEFAULT 0,
  recall float NOT NULL DEFAULT 0,
  f1_score float NOT NULL DEFAULT 0,
  roc_auc float NOT NULL DEFAULT 0,
  false_positives int NOT NULL DEFAULT 0,
  false_negatives int NOT NULL DEFAULT 0,
  true_positives int NOT NULL DEFAULT 0,
  true_negatives int NOT NULL DEFAULT 0,
  trained_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_model_metrics_model_name ON model_metrics(model_name);
CREATE INDEX IF NOT EXISTS idx_model_metrics_trained_at ON model_metrics(trained_at);

ALTER TABLE model_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_model_metrics" ON model_metrics;
CREATE POLICY "anon_select_model_metrics" ON model_metrics FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_model_metrics" ON model_metrics;
CREATE POLICY "anon_insert_model_metrics" ON model_metrics FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_model_metrics" ON model_metrics;
CREATE POLICY "anon_update_model_metrics" ON model_metrics FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_model_metrics" ON model_metrics;
CREATE POLICY "anon_delete_model_metrics" ON model_metrics FOR DELETE
  TO anon, authenticated USING (true);
