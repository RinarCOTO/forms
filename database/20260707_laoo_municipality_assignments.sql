-- Allow a LAOO user to be assigned to more than one municipality.
-- Keep users.municipality as the legacy primary assignment for older code paths.

BEGIN;

CREATE TABLE IF NOT EXISTS public.laoo_municipality_assignments (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  municipality TEXT NOT NULL CHECK (
    municipality IN (
      'barlig',
      'bauko',
      'besao',
      'bontoc',
      'natonin',
      'paracellis',
      'sabangan',
      'sagada',
      'sadanga',
      'tadian'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id),
  PRIMARY KEY (user_id, municipality)
);

CREATE INDEX IF NOT EXISTS idx_laoo_municipality_assignments_municipality
  ON public.laoo_municipality_assignments(municipality);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.laoo_municipality_assignments
  TO authenticated;

GRANT ALL ON public.laoo_municipality_assignments
  TO service_role;

INSERT INTO public.laoo_municipality_assignments (user_id, municipality)
SELECT
  id,
  lower(trim(municipality))
FROM public.users
WHERE role = 'laoo'
  AND municipality IS NOT NULL
  AND lower(trim(municipality)) IN (
    'barlig',
    'bauko',
    'besao',
    'bontoc',
    'natonin',
    'paracellis',
    'sabangan',
    'sagada',
    'sadanga',
    'tadian'
  )
ON CONFLICT (user_id, municipality) DO NOTHING;

ALTER TABLE public.laoo_municipality_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage LAOO municipality assignments"
  ON public.laoo_municipality_assignments;

CREATE POLICY "Admins manage LAOO municipality assignments"
  ON public.laoo_municipality_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN (
          'super_admin',
          'admin',
          'provincial_assessor',
          'assistant_provincial_assessor'
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN (
          'super_admin',
          'admin',
          'provincial_assessor',
          'assistant_provincial_assessor'
        )
    )
  );

DROP POLICY IF EXISTS "LAOO users read own municipality assignments"
  ON public.laoo_municipality_assignments;

CREATE POLICY "LAOO users read own municipality assignments"
  ON public.laoo_municipality_assignments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

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
    OR EXISTS (
      SELECT 1
      FROM public.laoo_municipality_assignments a
      WHERE a.user_id = auth.uid()
        AND (
          lower(trim(a.municipality)) = lower(trim(building_structures.municipality))
          OR lower(trim(a.municipality)) = lower(trim(building_structures.location_municipality))
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
    OR EXISTS (
      SELECT 1
      FROM public.laoo_municipality_assignments a
      WHERE a.user_id = auth.uid()
        AND (
          lower(trim(a.municipality)) = lower(trim(land_improvements.municipality))
          OR lower(trim(a.municipality)) = lower(trim(land_improvements.location_municipality))
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
    OR EXISTS (
      SELECT 1
      FROM public.laoo_municipality_assignments a
      WHERE a.user_id = auth.uid()
        AND (
          lower(trim(a.municipality)) = lower(trim(machinery.municipality))
          OR lower(trim(a.municipality)) = lower(trim(machinery.location_municipality))
        )
    )
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
