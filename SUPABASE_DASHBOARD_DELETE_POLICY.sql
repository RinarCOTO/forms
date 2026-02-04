-- Policy: Super admins can delete any record from building_structures (dashboard)
-- Run this in your Supabase SQL Editor

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Super admins can delete from dashboard" ON public.building_structures;

-- Create new delete policy for super_admins
CREATE POLICY "Super admins can delete from dashboard"
ON public.building_structures
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Re-enable RLS if not already enabled
ALTER TABLE public.building_structures ENABLE ROW LEVEL SECURITY;

-- (Optional) Test: Only super_admin can delete
-- DELETE FROM public.building_structures WHERE id = 1; -- Should only work for super_admin
