-- PostgreSQL Schema for RPFAAS Forms Application
-- Run this file with: psql -U postgres -d forms_db -f database/schema.sql

-- ============================================
-- Building Structures Table
-- ============================================
CREATE TABLE IF NOT EXISTS building_structures (
    id SERIAL PRIMARY KEY,
    
    -- Step 1: Property Information
    arp_no VARCHAR(50),
    pin VARCHAR(50),
    owner_name VARCHAR(255),
    owner_address TEXT,
    
    -- Step 2: Building Details
    type_of_building VARCHAR(100),
    number_of_storeys INTEGER,
    date_constructed DATE,
    date_completed DATE,
    date_occupied DATE,
    building_permit_no VARCHAR(100),
    
    -- Step 3: Construction Details
    total_floor_area DECIMAL(10, 2),
    construction_type VARCHAR(100),
    structure_type VARCHAR(100),
    foundation_type VARCHAR(100),
    
    -- Step 4: Additional Details
    electrical_system VARCHAR(100),
    plumbing_system VARCHAR(100),
    roofing_material VARCHAR(100),
    wall_material VARCHAR(100),
    flooring_material VARCHAR(100),
    ceiling_material VARCHAR(100),
    
    -- Step 5: Assessment
    actual_use VARCHAR(100),
    market_value DECIMAL(15, 2),
    assessment_level DECIMAL(5, 2),
    estimated_value DECIMAL(15, 2),
    amount_in_words TEXT,
    
    -- Metadata
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_building_arp_no ON building_structures(arp_no);
CREATE INDEX IF NOT EXISTS idx_building_pin ON building_structures(pin);
CREATE INDEX IF NOT EXISTS idx_building_owner_name ON building_structures(owner_name);
CREATE INDEX IF NOT EXISTS idx_building_status ON building_structures(status);
CREATE INDEX IF NOT EXISTS idx_building_created_at ON building_structures(created_at DESC);

-- ============================================
-- Land Improvements Table
-- ============================================
CREATE TABLE IF NOT EXISTS land_improvements (
    id SERIAL PRIMARY KEY,
    
    -- Property Information
    arp_no VARCHAR(50),
    pin VARCHAR(50),
    owner_name VARCHAR(255),
    owner_address TEXT,
    
    -- Improvement Details
    improvement_type VARCHAR(100),
    description TEXT,
    area DECIMAL(10, 2),
    unit_of_measure VARCHAR(20),
    
    -- Assessment
    market_value DECIMAL(15, 2),
    assessment_level DECIMAL(5, 2),
    assessed_value DECIMAL(15, 2),
    
    -- Metadata
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_land_arp_no ON land_improvements(arp_no);
CREATE INDEX IF NOT EXISTS idx_land_pin ON land_improvements(pin);
CREATE INDEX IF NOT EXISTS idx_land_owner_name ON land_improvements(owner_name);

-- ============================================
-- Machinery Table
-- ============================================
CREATE TABLE IF NOT EXISTS machinery (
    id SERIAL PRIMARY KEY,
    
    -- Property Information
    arp_no VARCHAR(50),
    pin VARCHAR(50),
    owner_name VARCHAR(255),
    owner_address TEXT,
    
    -- Machinery Details
    machinery_type VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    year_manufactured INTEGER,
    capacity VARCHAR(100),
    condition VARCHAR(50),
    
    -- Assessment
    market_value DECIMAL(15, 2),
    assessment_level DECIMAL(5, 2),
    assessed_value DECIMAL(15, 2),
    
    -- Metadata
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_machinery_arp_no ON machinery(arp_no);
CREATE INDEX IF NOT EXISTS idx_machinery_pin ON machinery(pin);
CREATE INDEX IF NOT EXISTS idx_machinery_owner_name ON machinery(owner_name);

-- ============================================
-- Users Table (for future authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================
-- Audit Log Table (for tracking changes)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100),
    record_id INTEGER,
    action VARCHAR(50),
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);

-- ============================================
-- Trigger to auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_building_structures_updated_at BEFORE UPDATE ON building_structures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_land_improvements_updated_at BEFORE UPDATE ON land_improvements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machinery_updated_at BEFORE UPDATE ON machinery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================
-- Uncomment to insert sample data:
/*
INSERT INTO building_structures (
    arp_no, pin, owner_name, owner_address, 
    type_of_building, number_of_storeys, 
    actual_use, estimated_value, status
) VALUES (
    'ARP-2024-001', 'PIN-123456', 'Juan Dela Cruz', '123 Main Street, Manila',
    'Residential', 2, 
    'Residential', 1500000.00, 'draft'
);
*/

-- ============================================
-- Verify Tables Created
-- ============================================
SELECT 
    table_name, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
