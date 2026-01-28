# CREATE DATABASE - COPY THIS SQL TO SUPABASE

## Go to: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/sql/new

## Copy everything below and click RUN:

```sql
-- Users Table (extends Supabase auth.users)
CREATE TABLE users (
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

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

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

-- Building Structures
CREATE TABLE building_structures (
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

-- Land Improvements
CREATE TABLE land_improvements (
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

-- Machinery
CREATE TABLE machinery (
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

-- Audit Logs
CREATE TABLE audit_logs (
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

-- Done! Check Table Editor to verify.
```
