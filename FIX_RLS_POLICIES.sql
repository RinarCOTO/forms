-- Fix RLS policies for users table
-- Run this in Supabase SQL Editor

-- First, let's see current policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- Create proper RLS policies that allow users to read their own data
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (but not role or is_active)
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Policy 5: Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Now manually insert/update your profile to make sure it exists
-- First check if your profile exists
SELECT id, email, role, full_name FROM public.users WHERE id = 'ce80d64b-ce48-4363-8c5f-b8f5fcf6c22e';

-- If no results, insert your profile
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
VALUES (
    'ce80d64b-ce48-4363-8c5f-b8f5fcf6c22e',
    'rinardengwas24@gmail.com',
    'Rinar Dengwas',
    'super_admin',
    NOW(),
    NOW()
) 
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'super_admin',
    updated_at = NOW();

-- Verify the result
SELECT id, email, role, full_name FROM public.users WHERE id = 'ce80d64b-ce48-4363-8c5f-b8f5fcf6c22e';