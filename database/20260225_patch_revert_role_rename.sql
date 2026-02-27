-- ============================================================
-- Patch: revert municipal_tax_mapper → municipal_assessor rename
-- Run in Supabase SQL editor AFTER 20260225_review_workflow_migration.sql
--
-- The previous migration incorrectly renamed municipal_tax_mapper.
-- This patch restores the role name and corrects its permissions:
--   - review.sign = true  (they sign FAAS and Tax Declaration)
--   - forms.submit = true (they can also submit forms)
--   - review.laoo  = false (LAOO review is provincial, not municipal)
-- ============================================================

-- 1. Rename back
UPDATE role_permissions
  SET role = 'municipal_tax_mapper'
  WHERE role = 'municipal_assessor';

-- 2. Grant signature permission to municipal_tax_mapper
UPDATE role_permissions
  SET allowed = true
  WHERE role = 'municipal_tax_mapper'
    AND feature = 'review.sign';

-- ── Verify ────────────────────────────────────────────────────────────────────
-- Expected: 0 rows
SELECT COUNT(*) AS municipal_assessor_remaining
FROM role_permissions WHERE role = 'municipal_assessor';

-- Expected: review.sign = true, forms.submit = true, review.laoo = false
SELECT role, feature, allowed
FROM role_permissions
WHERE role = 'municipal_tax_mapper'
  AND feature IN ('forms.submit', 'review.laoo', 'review.sign')
ORDER BY feature;
