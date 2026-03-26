-- ============================================================
-- Add signature_path to users table
-- Run once in the Supabase SQL editor.
--
-- signature_path: Supabase Storage path to the user's uploaded
--   signature image, used when signing FAAS forms in the review
--   workflow. NULL until the user uploads their signature.
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS signature_path TEXT;
