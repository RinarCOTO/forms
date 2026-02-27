-- ============================================================
-- Verification script for 20260225_review_workflow_migration.sql
-- Run in Supabase SQL editor. Expected results are in comments.
-- ============================================================


-- ── 1. New tables ─────────────────────────────────────────────────────────────
-- Expected: 4 rows (form_comments, form_attachments, tax_declarations, form_review_history)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'form_comments',
    'form_attachments',
    'tax_declarations',
    'form_review_history'
  )
ORDER BY table_name;


-- ── 2. New columns on users ───────────────────────────────────────────────────
-- Expected: 2 rows (laoo_level, municipality)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('municipality', 'laoo_level')
ORDER BY column_name;


-- ── 3. New columns on building_structures ─────────────────────────────────────
-- Expected: 4 rows
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'building_structures'
  AND column_name IN (
    'submitted_at', 'laoo_reviewer_id', 'laoo_approved_at', 'tax_declaration_id'
  )
ORDER BY column_name;


-- ── 4. New columns on land_improvements ──────────────────────────────────────
-- Expected: 4 rows
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'land_improvements'
  AND column_name IN (
    'submitted_at', 'laoo_reviewer_id', 'laoo_approved_at', 'tax_declaration_id'
  )
ORDER BY column_name;


-- ── 5. New columns on machinery ───────────────────────────────────────────────
-- Expected: 4 rows
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'machinery'
  AND column_name IN (
    'submitted_at', 'laoo_reviewer_id', 'laoo_approved_at', 'tax_declaration_id'
  )
ORDER BY column_name;


-- ── 6. Role permissions — new roles exist ─────────────────────────────────────
-- Expected: 3 distinct roles
SELECT DISTINCT role
FROM role_permissions
WHERE role IN (
  'laoo',
  'assistant_provincial_assessor',
  'provincial_assessor'
)
ORDER BY role;


-- ── 7. municipal_tax_mapper fully renamed ────────────────────────────────────
-- Expected: 0 rows (old name gone)
SELECT COUNT(*) AS old_role_remaining
FROM role_permissions
WHERE role = 'municipal_tax_mapper';

-- Expected: 23 rows (municipal_assessor now has all permissions)
SELECT COUNT(*) AS municipal_assessor_rows
FROM role_permissions
WHERE role = 'municipal_assessor';


-- ── 8. New permission features seeded for all roles ──────────────────────────
-- Expected: one row per role for each of the 3 new features (forms.submit, review.laoo, review.sign)
SELECT role, feature, allowed
FROM role_permissions
WHERE feature IN ('forms.submit', 'review.laoo', 'review.sign')
ORDER BY feature, role;


-- ── 9. RLS enabled on new tables ─────────────────────────────────────────────
-- Expected: 4 rows, all with row_security = 'ENABLED'
SELECT relname AS table_name,
       CASE relrowsecurity WHEN true THEN 'ENABLED' ELSE 'DISABLED' END AS row_security
FROM pg_class
WHERE relname IN (
  'form_comments',
  'form_attachments',
  'tax_declarations',
  'form_review_history'
)
ORDER BY relname;


-- ── 10. Triggers created ──────────────────────────────────────────────────────
-- Expected: 2 rows
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN (
  'trg_form_comments_updated_at',
  'trg_tax_declarations_updated_at'
)
ORDER BY trigger_name;


-- ── 11. form_comments columns ────────────────────────────────────────────────
-- Expected: 11 columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'form_comments'
ORDER BY ordinal_position;


-- ── 12. tax_declarations columns ─────────────────────────────────────────────
-- Expected: 13 columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tax_declarations'
ORDER BY ordinal_position;
