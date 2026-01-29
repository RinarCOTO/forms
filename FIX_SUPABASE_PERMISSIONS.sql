-- Fix Supabase Permissions for building_structures table
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/sql

-- 1. Grant permissions on the schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- 2. Grant permissions on the table
GRANT ALL ON TABLE public.building_structures TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.building_structures TO authenticated;
GRANT SELECT ON TABLE public.building_structures TO anon;

-- 3. Grant permissions on the sequence (for auto-incrementing ID)
GRANT USAGE, SELECT ON SEQUENCE public.building_structures_id_seq TO service_role, authenticated;

-- 4. Disable RLS temporarily to test (you can re-enable later with proper policies)
ALTER TABLE public.building_structures DISABLE ROW LEVEL SECURITY;

-- 5. OR keep RLS enabled but add permissive policies
-- Uncomment the following if you want to keep RLS enabled:

/*
-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow service role all access" ON public.building_structures;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.building_structures;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.building_structures;
DROP POLICY IF EXISTS "Allow authenticated update own" ON public.building_structures;

-- Create new policies
CREATE POLICY "Allow service role all access"
ON public.building_structures
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated read"
ON public.building_structures
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert"
ON public.building_structures
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update own"
ON public.building_structures
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon read"
ON public.building_structures
FOR SELECT
TO anon
USING (true);

-- Re-enable RLS
ALTER TABLE public.building_structures ENABLE ROW LEVEL SECURITY;
*/

-- 6. Verify permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'building_structures';
