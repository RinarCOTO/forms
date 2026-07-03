-- Stage 3 security hardening for core RLS surfaces.
--
-- Purpose:
-- - Remove direct authenticated write access to FAAS core tables where the app
--   writes through server-side service-role API routes.
-- - Remove direct authenticated access to form_locks; lock operations go
--   through /api/form-locks using service_role.
-- - Make service-role-only policies explicit on review/tax tables.

BEGIN;

-- ── FAAS core tables ────────────────────────────────────────────────────────
-- Reads remain available to authenticated users and are constrained by the
-- authenticated scoped SELECT policies from Stage 1. Writes go through API
-- routes using service_role so direct PostgREST clients cannot bypass workflow
-- checks.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.building_structures
  FROM authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.land_improvements
  FROM authenticated;

GRANT SELECT ON TABLE public.building_structures TO authenticated;
GRANT SELECT ON TABLE public.land_improvements TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.building_structures TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.land_improvements TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.machinery TO service_role;

DROP POLICY IF EXISTS "Super admins can delete from dashboard" ON public.building_structures;

-- ── form_locks ──────────────────────────────────────────────────────────────
ALTER TABLE public.form_locks ENABLE ROW LEVEL SECURITY;

REVOKE SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.form_locks
  FROM authenticated;

GRANT ALL PRIVILEGES ON TABLE public.form_locks TO service_role;

DROP POLICY IF EXISTS "Service role manages form locks" ON public.form_locks;
CREATE POLICY "Service role manages form locks"
  ON public.form_locks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── service-role-only safety policies ───────────────────────────────────────
DROP POLICY IF EXISTS "Service role manages tax declarations" ON public.tax_declarations;
CREATE POLICY "Service role manages tax declarations"
  ON public.tax_declarations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages review history" ON public.form_review_history;
CREATE POLICY "Service role manages review history"
  ON public.form_review_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
