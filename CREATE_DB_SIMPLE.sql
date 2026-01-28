# CREATE DATABASE - COPY THIS SQL TO SUPABASE

## Go to: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/sql/new

## Copy everything below and click RUN:

```sql
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
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
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
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
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
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    record_id INTEGER,
    action VARCHAR(50),
    user_id INTEGER,
    username VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Done! Check Table Editor to verify.
```
