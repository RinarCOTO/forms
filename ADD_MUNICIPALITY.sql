-- ============================================================
-- ADD MUNICIPALITY SUPPORT
-- Run this in your Supabase SQL editor:
-- https://app.supabase.com/project/_/sql/new
-- ============================================================

-- 1. Add municipality column to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS municipality VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_users_municipality ON public.users(municipality);

-- 2. Add municipality column to data tables so records are scoped per municipality
ALTER TABLE public.building_structures
  ADD COLUMN IF NOT EXISTS municipality VARCHAR(50);

ALTER TABLE public.land_improvements
  ADD COLUMN IF NOT EXISTS municipality VARCHAR(50);

ALTER TABLE public.machinery
  ADD COLUMN IF NOT EXISTS municipality VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_building_structures_municipality ON public.building_structures(municipality);
CREATE INDEX IF NOT EXISTS idx_land_improvements_municipality   ON public.land_improvements(municipality);
CREATE INDEX IF NOT EXISTS idx_machinery_municipality           ON public.machinery(municipality);

-- 3. Drop old over-permissive RLS policies on data tables and replace with
--    municipality-scoped ones.
--    (Only non-admin users are restricted; admin/super_admin bypass via service role.)

-- building_structures
DROP POLICY IF EXISTS "Users can view building structures"           ON public.building_structures;
DROP POLICY IF EXISTS "Authenticated users can view building structures" ON public.building_structures;
DROP POLICY IF EXISTS "Users can insert building structures"         ON public.building_structures;
DROP POLICY IF EXISTS "Users can update own building structures"     ON public.building_structures;
DROP POLICY IF EXISTS "Admins can update any building structure"     ON public.building_structures;

-- Allow SELECT: same municipality OR no municipality filter (admin APIs use service role and bypass RLS)
CREATE POLICY "Municipality scoped select on building_structures"
  ON public.building_structures FOR SELECT
  USING (
    -- admins see everything
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
    OR
    -- user has no municipality → sees everything (backwards compat)
    NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND municipality IS NOT NULL
    )
    OR
    -- user's municipality matches record's municipality
    municipality = (
      SELECT u.municipality FROM public.users u WHERE u.id = auth.uid()
    )
  );

-- land_improvements
DROP POLICY IF EXISTS "Users can view land improvements"             ON public.land_improvements;
DROP POLICY IF EXISTS "Authenticated users can view land improvements" ON public.land_improvements;
DROP POLICY IF EXISTS "Users can insert land improvements"           ON public.land_improvements;
DROP POLICY IF EXISTS "Users can update own land improvements"       ON public.land_improvements;
DROP POLICY IF EXISTS "Admins can update any land improvement"       ON public.land_improvements;

CREATE POLICY "Municipality scoped select on land_improvements"
  ON public.land_improvements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
    OR
    NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND municipality IS NOT NULL
    )
    OR
    municipality = (
      SELECT u.municipality FROM public.users u WHERE u.id = auth.uid()
    )
  );

-- machinery
DROP POLICY IF EXISTS "Users can view machinery"                     ON public.machinery;
DROP POLICY IF EXISTS "Authenticated users can view machinery"       ON public.machinery;
DROP POLICY IF EXISTS "Users can insert machinery"                   ON public.machinery;
DROP POLICY IF EXISTS "Users can update own machinery"               ON public.machinery;
DROP POLICY IF EXISTS "Admins can update any machinery"              ON public.machinery;

CREATE POLICY "Municipality scoped select on machinery"
  ON public.machinery FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
    OR
    NOT EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND municipality IS NOT NULL
    )
    OR
    municipality = (
      SELECT u.municipality FROM public.users u WHERE u.id = auth.uid()
    )
  );

-- ============================================================
-- Done! Next steps:
-- 1. Run this SQL in Supabase dashboard
-- 2. Deploy updated application code
-- 3. Assign municipalities to users via Manage Users page
-- ============================================================
