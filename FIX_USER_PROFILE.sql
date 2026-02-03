-- Fix user profile for rinardengwas24@gmail.com
-- Run this in Supabase SQL Editor

-- First, check if user exists in users table
SELECT id, email, role, full_name FROM public.users WHERE email = 'rinardengwas24@gmail.com';

-- If user doesn't exist, insert the user profile manually
-- Get the user ID from auth.users first
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
    'super_admin' as role,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users au 
WHERE au.email = 'rinardengwas24@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
);

-- If user exists but role is not super_admin, update it
UPDATE public.users 
SET 
    role = 'super_admin',
    updated_at = NOW()
WHERE email = 'rinardengwas24@gmail.com' 
AND role != 'super_admin';

-- Verify the result
SELECT id, email, role, full_name FROM public.users WHERE email = 'rinardengwas24@gmail.com';