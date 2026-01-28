-- ============================================
-- MIGRATION SCRIPT: Update Existing Tables
-- ============================================
-- This script updates your existing tables to work with the new users table
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/sql/new

-- Step 1: Create the users table first
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    department VARCHAR(100),
    position VARCHAR(100),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::uuid = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::uuid = id);

CREATE POLICY "Admins can view all profiles"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'admin'
    )
  );

-- Step 2: Modify existing building_structures table
-- ============================================

-- Add new UUID columns
ALTER TABLE building_structures 
  ADD COLUMN IF NOT EXISTS created_by_uuid UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_by_uuid UUID REFERENCES users(id);

-- Rename old columns (keep them temporarily for backup)
ALTER TABLE building_structures 
  RENAME COLUMN created_by TO created_by_old;
ALTER TABLE building_structures 
  RENAME COLUMN updated_by TO updated_by_old;

-- Rename new columns to the correct names
ALTER TABLE building_structures 
  RENAME COLUMN created_by_uuid TO created_by;
ALTER TABLE building_structures 
  RENAME COLUMN updated_by_uuid TO updated_by;

-- Optional: Drop old columns after verifying everything works
-- ALTER TABLE building_structures DROP COLUMN IF EXISTS created_by_old;
-- ALTER TABLE building_structures DROP COLUMN IF EXISTS updated_by_old;

-- Step 3: Modify existing land_improvements table
-- ============================================

ALTER TABLE land_improvements 
  ADD COLUMN IF NOT EXISTS created_by_uuid UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_by_uuid UUID REFERENCES users(id);

ALTER TABLE land_improvements 
  RENAME COLUMN created_by TO created_by_old;
ALTER TABLE land_improvements 
  RENAME COLUMN updated_by TO updated_by_old;

ALTER TABLE land_improvements 
  RENAME COLUMN created_by_uuid TO created_by;
ALTER TABLE land_improvements 
  RENAME COLUMN updated_by_uuid TO updated_by;

-- Optional: Drop old columns after verifying
-- ALTER TABLE land_improvements DROP COLUMN IF EXISTS created_by_old;
-- ALTER TABLE land_improvements DROP COLUMN IF EXISTS updated_by_old;

-- Step 4: Modify existing machinery table
-- ============================================

ALTER TABLE machinery 
  ADD COLUMN IF NOT EXISTS created_by_uuid UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_by_uuid UUID REFERENCES users(id);

ALTER TABLE machinery 
  RENAME COLUMN created_by TO created_by_old;
ALTER TABLE machinery 
  RENAME COLUMN updated_by TO updated_by_old;

ALTER TABLE machinery 
  RENAME COLUMN created_by_uuid TO created_by;
ALTER TABLE machinery 
  RENAME COLUMN updated_by_uuid TO updated_by;

-- Optional: Drop old columns after verifying
-- ALTER TABLE machinery DROP COLUMN IF EXISTS created_by_old;
-- ALTER TABLE machinery DROP COLUMN IF EXISTS updated_by_old;

-- Step 5: Modify existing audit_logs table
-- ============================================

ALTER TABLE audit_logs 
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID REFERENCES users(id);

ALTER TABLE audit_logs 
  RENAME COLUMN user_id TO user_id_old;

ALTER TABLE audit_logs 
  RENAME COLUMN user_id_uuid TO user_id;

-- Optional: Drop old column after verifying
-- ALTER TABLE audit_logs DROP COLUMN IF EXISTS user_id_old;

-- Step 6: Add indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_building_structures_arp ON building_structures(arp_no);
CREATE INDEX IF NOT EXISTS idx_building_structures_pin ON building_structures(pin);
CREATE INDEX IF NOT EXISTS idx_building_structures_status ON building_structures(status);
CREATE INDEX IF NOT EXISTS idx_building_structures_created_by ON building_structures(created_by);

CREATE INDEX IF NOT EXISTS idx_land_improvements_arp ON land_improvements(arp_no);
CREATE INDEX IF NOT EXISTS idx_land_improvements_pin ON land_improvements(pin);
CREATE INDEX IF NOT EXISTS idx_land_improvements_status ON land_improvements(status);
CREATE INDEX IF NOT EXISTS idx_land_improvements_created_by ON land_improvements(created_by);

CREATE INDEX IF NOT EXISTS idx_machinery_arp ON machinery(arp_no);
CREATE INDEX IF NOT EXISTS idx_machinery_pin ON machinery(pin);
CREATE INDEX IF NOT EXISTS idx_machinery_status ON machinery(status);
CREATE INDEX IF NOT EXISTS idx_machinery_created_by ON machinery(created_by);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);

-- Step 7: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE building_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE land_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE machinery ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Building Structures RLS Policies
CREATE POLICY "Users can view all building structures"
  ON building_structures FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert building structures"
  ON building_structures FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own building structures"
  ON building_structures FOR UPDATE
  USING (created_by = auth.uid()::uuid)
  WITH CHECK (created_by = auth.uid()::uuid);

CREATE POLICY "Admins can update all building structures"
  ON building_structures FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete building structures"
  ON building_structures FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'admin'
    )
  );

-- Land Improvements RLS Policies
CREATE POLICY "Users can view all land improvements"
  ON land_improvements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert land improvements"
  ON land_improvements FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own land improvements"
  ON land_improvements FOR UPDATE
  USING (created_by = auth.uid()::uuid)
  WITH CHECK (created_by = auth.uid()::uuid);

CREATE POLICY "Admins can update all land improvements"
  ON land_improvements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete land improvements"
  ON land_improvements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'admin'
    )
  );

-- Machinery RLS Policies
CREATE POLICY "Users can view all machinery"
  ON machinery FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert machinery"
  ON machinery FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own machinery"
  ON machinery FOR UPDATE
  USING (created_by = auth.uid()::uuid)
  WITH CHECK (created_by = auth.uid()::uuid);

CREATE POLICY "Admins can update all machinery"
  ON machinery FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete machinery"
  ON machinery FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'admin'
    )
  );

-- Audit Logs RLS Policies
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid AND role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- DONE!
-- ============================================
-- Your existing tables are now updated to work with the users table!
-- Old columns are renamed with _old suffix for backup.
-- 
-- Next steps:
-- 1. Test the application to make sure everything works
-- 2. If everything works, uncomment and run the DROP COLUMN statements above
-- 3. Create your first user via signup
-- 4. Make that user an admin:
--    UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
