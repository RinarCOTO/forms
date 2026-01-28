# COMPLETE DATABASE SETUP - COPY THIS SQL TO SUPABASE

## Go to: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/sql/new

## Copy everything below and click RUN:

```sql
-- ============================================
-- USERS TABLE (Must be created first)
-- ============================================

-- Users Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'user', 'assessor', etc.
    department VARCHAR(100),
    position VARCHAR(100),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
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

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
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

-- ============================================
-- BUILDING STRUCTURES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS building_structures (
    id SERIAL PRIMARY KEY,
    arp_no VARCHAR(50),
    pin VARCHAR(50),
    owner_name VARCHAR(255),
    owner_address TEXT,
    type_of_building VARCHAR(100),
    number_of_storeys INTEGER,
    date_constructed DATE,
    date_completed DATE,
    date_occupied DATE,
    building_permit_no VARCHAR(100),
    total_floor_area DECIMAL(10, 2),
    construction_type VARCHAR(100),
    structure_type VARCHAR(100),
    foundation_type VARCHAR(100),
    electrical_system VARCHAR(100),
    plumbing_system VARCHAR(100),
    roofing_material VARCHAR(100),
    wall_material VARCHAR(100),
    flooring_material VARCHAR(100),
    ceiling_material VARCHAR(100),
    actual_use VARCHAR(100),
    market_value DECIMAL(15, 2),
    assessment_level DECIMAL(5, 2),
    estimated_value DECIMAL(15, 2),
    amount_in_words TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ============================================
-- LAND IMPROVEMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS land_improvements (
    id SERIAL PRIMARY KEY,
    arp_no VARCHAR(50),
    pin VARCHAR(50),
    owner_name VARCHAR(255),
    owner_address TEXT,
    improvement_type VARCHAR(100),
    description TEXT,
    area DECIMAL(10, 2),
    unit_of_measure VARCHAR(20),
    market_value DECIMAL(15, 2),
    assessment_level DECIMAL(5, 2),
    assessed_value DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ============================================
-- MACHINERY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS machinery (
    id SERIAL PRIMARY KEY,
    arp_no VARCHAR(50),
    pin VARCHAR(50),
    owner_name VARCHAR(255),
    owner_address TEXT,
    machinery_type VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    year_manufactured INTEGER,
    capacity VARCHAR(100),
    condition VARCHAR(50),
    market_value DECIMAL(15, 2),
    assessment_level DECIMAL(5, 2),
    assessed_value DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    record_id INTEGER,
    action VARCHAR(50),
    user_id UUID REFERENCES users(id),
    username VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
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

-- ============================================
-- ROW LEVEL SECURITY (RLS) FOR DATA TABLES
-- ============================================

-- Enable RLS on all tables
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
-- Check Table Editor to verify all tables are created.
-- 
-- Next steps:
-- 1. Create your first user via signup
-- 2. Make that user an admin:
--    UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
-- 3. Start using the application!
```
