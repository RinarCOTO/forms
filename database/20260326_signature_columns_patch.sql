-- ============================================================
-- Signature & Reviewer Columns Patch
-- Run once in the Supabase SQL editor.
--
-- Adds columns needed by the digital-signature review workflow:
--   submitted_signature_path  – snapshot of mapper's sig at submit time
--   municipal_reviewer_id     – user who performed sign_forward
--   municipal_signed_at       – timestamp of sign_forward
--   municipal_signature_path  – snapshot of municipal reviewer's sig
--   provincial_reviewer_id    – user who performed sign_approve
--   provincial_signed_at      – timestamp of sign_approve
--   provincial_signature_path – snapshot of provincial reviewer's sig
-- ============================================================

-- ── building_structures ──────────────────────────────────────
ALTER TABLE building_structures
  ADD COLUMN IF NOT EXISTS submitted_signature_path   TEXT,
  ADD COLUMN IF NOT EXISTS municipal_reviewer_id      UUID,
  ADD COLUMN IF NOT EXISTS municipal_signed_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS municipal_signature_path   TEXT,
  ADD COLUMN IF NOT EXISTS provincial_reviewer_id     UUID,
  ADD COLUMN IF NOT EXISTS provincial_signed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provincial_signature_path  TEXT;

-- ── land_improvements ────────────────────────────────────────
ALTER TABLE land_improvements
  ADD COLUMN IF NOT EXISTS submitted_signature_path   TEXT,
  ADD COLUMN IF NOT EXISTS municipal_reviewer_id      UUID,
  ADD COLUMN IF NOT EXISTS municipal_signed_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS municipal_signature_path   TEXT,
  ADD COLUMN IF NOT EXISTS provincial_reviewer_id     UUID,
  ADD COLUMN IF NOT EXISTS provincial_signed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provincial_signature_path  TEXT;
