-- Stage 1 security hardening for FAAS tables.
--
-- Purpose:
-- - Remove anonymous direct reads from land_improvements.
-- - Enable RLS on machinery.
-- - Replace FAAS SELECT policies with authenticated, scoped policies.
--
-- This migration is idempotent and intentionally does not change users,
-- role_permissions, form_locks, or comments; those are staged separately.

BEGIN;

REVOKE SELECT ON TABLE public.land_improvements FROM anon;

ALTER TABLE public.building_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machinery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all building structures" ON public.building_structures;
DROP POLICY IF EXISTS "Users can view building structures" ON public.building_structures;
DROP POLICY IF EXISTS "Municipality scoped select on building_structures" ON public.building_structures;

DROP POLICY IF EXISTS "Users can view all land improvements" ON public.land_improvements;
DROP POLICY IF EXISTS "Users can view land improvements" ON public.land_improvements;
DROP POLICY IF EXISTS "Municipality scoped select on land_improvements" ON public.land_improvements;

DROP POLICY IF EXISTS "Users can view all machinery" ON public.machinery;
DROP POLICY IF EXISTS "Users can view machinery" ON public.machinery;
DROP POLICY IF EXISTS "Municipality scoped select on machinery" ON public.machinery;

CREATE POLICY "Authenticated scoped select on building_structures"
  ON public.building_structures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'super_admin', 'laoo', 'assistant_provincial_assessor', 'provincial_assessor')
    )
    OR created_by::text = auth.uid()::text
    OR assigned_to = auth.uid()
    OR appraised_by = auth.uid()
    OR laoo_reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.municipality IS NOT NULL
        AND (
          lower(trim(u.municipality)) = lower(trim(building_structures.municipality))
          OR lower(trim(u.municipality)) = lower(trim(building_structures.location_municipality))
        )
    )
  );

CREATE POLICY "Authenticated scoped select on land_improvements"
  ON public.land_improvements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'super_admin', 'laoo', 'assistant_provincial_assessor', 'provincial_assessor')
    )
    OR created_by::text = auth.uid()::text
    OR assigned_to = auth.uid()
    OR appraised_by = auth.uid()
    OR laoo_reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.municipality IS NOT NULL
        AND (
          lower(trim(u.municipality)) = lower(trim(land_improvements.municipality))
          OR lower(trim(u.municipality)) = lower(trim(land_improvements.location_municipality))
        )
    )
  );

CREATE POLICY "Authenticated scoped select on machinery"
  ON public.machinery
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'super_admin', 'laoo', 'assistant_provincial_assessor', 'provincial_assessor')
    )
    OR created_by::text = auth.uid()::text
    OR appraised_by = auth.uid()
    OR laoo_reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.municipality IS NOT NULL
        AND (
          lower(trim(u.municipality)) = lower(trim(machinery.municipality))
          OR lower(trim(u.municipality)) = lower(trim(machinery.location_municipality))
        )
    )
  );

COMMIT;
