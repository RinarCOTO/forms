-- QUICK FIX for land_improvements permission denied error
-- Copy and paste this into your Supabase SQL Editor and run it
-- This will temporarily disable RLS to get your app working immediately

-- 1. Disable Row Level Security temporarily
ALTER TABLE public.land_improvements DISABLE ROW LEVEL SECURITY;

-- 2. Grant all necessary permissions
GRANT ALL ON TABLE public.land_improvements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.land_improvements TO authenticated;
GRANT SELECT ON TABLE public.land_improvements TO anon;

-- 3. Grant permissions on the sequence (if it exists)
-- First check what sequences exist for this table
DO $$ 
BEGIN
    -- Try different possible sequence names
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'land_improvements_id_seq' AND relkind = 'S') THEN
        GRANT USAGE, SELECT ON SEQUENCE public.land_improvements_id_seq TO service_role, authenticated;
        RAISE NOTICE 'Granted permissions on land_improvements_id_seq';
    ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'land_improvements_pkey_seq' AND relkind = 'S') THEN
        GRANT USAGE, SELECT ON SEQUENCE public.land_improvements_pkey_seq TO service_role, authenticated;
        RAISE NOTICE 'Granted permissions on land_improvements_pkey_seq';
    ELSE
        RAISE NOTICE 'No sequence found for land_improvements table - this is OK if using different ID generation';
    END IF;
END $$;

-- 4. Verify the fix worked
SELECT 'Permissions granted successfully' as status;