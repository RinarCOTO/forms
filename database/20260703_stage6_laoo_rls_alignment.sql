-- Stage 6 security closeout.
--
-- Purpose:
-- - Align direct PostgREST/RLS reads with the Stage 4 API authorization model.
-- - LAOO users are municipality/assignment scoped, not province-wide.

BEGIN;

DROP POLICY IF EXISTS "Authenticated scoped select on building_structures"
  ON public.building_structures;

CREATE POLICY "Authenticated scoped select on building_structures"
  ON public.building_structures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'super_admin', 'assistant_provincial_assessor', 'provincial_assessor')
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

DROP POLICY IF EXISTS "Authenticated scoped select on land_improvements"
  ON public.land_improvements;

CREATE POLICY "Authenticated scoped select on land_improvements"
  ON public.land_improvements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'super_admin', 'assistant_provincial_assessor', 'provincial_assessor')
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

DROP POLICY IF EXISTS "Authenticated scoped select on machinery"
  ON public.machinery;

CREATE POLICY "Authenticated scoped select on machinery"
  ON public.machinery
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'super_admin', 'assistant_provincial_assessor', 'provincial_assessor')
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
