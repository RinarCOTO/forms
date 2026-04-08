-- Form Locks: pessimistic locking to prevent concurrent editing
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS form_locks (
  form_type   text        NOT NULL,
  form_id     integer     NOT NULL,
  locked_by   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_name text        NOT NULL,
  expires_at  timestamptz NOT NULL,
  PRIMARY KEY (form_type, form_id)
);

-- Auto-clean expired locks (optional index for performance)
CREATE INDEX IF NOT EXISTS idx_form_locks_expires_at ON form_locks(expires_at);

-- Grant permissions (required for service_role and authenticated users)
GRANT ALL ON TABLE public.form_locks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.form_locks TO authenticated;
