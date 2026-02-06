-- Fix Supabase Permissions for land_improvements table
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/YOUR_PROJECT_ID/sql

-- 1. Grant permissions on the schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- 2. Grant permissions on the table
GRANT ALL ON TABLE public.land_improvements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.land_improvements TO authenticated;
GRANT SELECT ON TABLE public.land_improvements TO anon;

-- 3. Grant permissions on the sequence (for auto-incrementing ID)
GRANT USAGE, SELECT ON SEQUENCE public.land_improvements_id_seq TO service_role, authenticated;

-- 4. Drop existing policies if any
DROP POLICY IF EXISTS "Allow service role all access" ON public.land_improvements;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.land_improvements;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.land_improvements;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.land_improvements;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.land_improvements;
DROP POLICY IF EXISTS "Allow anon read" ON public.land_improvements;

-- 5. Create comprehensive policies
CREATE POLICY "Allow service role all access"
ON public.land_improvements
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated read"
ON public.land_improvements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert"
ON public.land_improvements
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update"
ON public.land_improvements
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete"
ON public.land_improvements
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Allow anon read"
ON public.land_improvements
FOR SELECT
TO anon
USING (true);

-- 6. Ensure RLS is enabled
ALTER TABLE public.land_improvements ENABLE ROW LEVEL SECURITY;

-- 7. Verify permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'land_improvements';

-- 8. Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'land_improvements';