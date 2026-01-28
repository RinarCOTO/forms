-- Verification Script - Run this to check if migration worked
-- Copy and paste this in Supabase SQL Editor

-- Check if users table exists and has correct structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Check if building_structures has new UUID columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'building_structures' 
    AND column_name IN ('created_by', 'updated_by', 'created_by_old', 'updated_by_old')
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('users', 'building_structures', 'land_improvements', 'machinery', 'audit_logs')
ORDER BY tablename, policyname;

-- Verify trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
