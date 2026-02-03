-- COMPLETE FIX: Create users table, trigger, and sync existing auth users
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/sql/new

-- Step 1: Drop and recreate users table to ensure clean structure
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    department TEXT,
    position TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Step 3: Grant permissions
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.users TO anon;

-- Step 4: Disable RLS for now to avoid conflicts
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 5: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'user',
    NEW.created_at,
    NEW.updated_at
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail auth
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Sync existing auth users to users table
INSERT INTO public.users (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
    'user',
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Step 8: Set rinardengwas24@gmail.com as super_admin
UPDATE public.users
SET role = 'super_admin'
WHERE email = 'rinardengwas24@gmail.com';

-- Step 9: Verify everything worked
SELECT 'Users table count:' as info, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Auth users count:' as info, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Super admin set:' as info, COUNT(*) as count FROM public.users WHERE role = 'super_admin';

-- Step 10: Show all users
SELECT id, email, full_name, role, created_at FROM public.users ORDER BY created_at;