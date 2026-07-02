-- In-app notifications for workflow events.
-- Run this once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS notifications (
  id                BIGSERIAL PRIMARY KEY,
  recipient_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  title             TEXT        NOT NULL,
  message           TEXT        NOT NULL,
  type              TEXT        NOT NULL,
  related_form_type TEXT,
  related_form_id   INTEGER,
  link_url          TEXT,
  is_read           BOOLEAN     NOT NULL DEFAULT false,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created
  ON notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON notifications (recipient_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_related_form
  ON notifications (related_form_type, related_form_id);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, UPDATE ON TABLE notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE notifications TO service_role;
GRANT USAGE, SELECT ON SEQUENCE notifications_id_seq TO authenticated, service_role;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());
