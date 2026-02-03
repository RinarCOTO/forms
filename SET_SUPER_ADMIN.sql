-- Set a user as super_admin in Supabase users table
-- Run this in Supabase SQL Editor

UPDATE public.users
SET role = 'super_admin'
WHERE email = 'rinardengwas24@gmail.com';

-- Optionally, verify the change:
SELECT id, email, role FROM public.users WHERE email = 'rinardengwas24@gmail.com';