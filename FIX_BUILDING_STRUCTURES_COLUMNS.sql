-- Add missing columns to building_structures table
-- Run this in Supabase SQL Editor

-- Add location-related columns for owner, admin, and property
ALTER TABLE public.building_structures 
ADD COLUMN IF NOT EXISTS owner_province_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS owner_municipality_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS owner_barangay_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS admin_care_of VARCHAR(255),
ADD COLUMN IF NOT EXISTS admin_province_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS admin_municipality_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS admin_barangay_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS property_address TEXT,
ADD COLUMN IF NOT EXISTS property_province_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS property_municipality_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS property_barangay_code VARCHAR(10);

-- Fix permissions for building_structures table
-- Grant all permissions to authenticated users
GRANT ALL ON TABLE public.building_structures TO authenticated;
GRANT ALL ON TABLE public.building_structures TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.building_structures_id_seq TO authenticated, service_role;

-- Disable RLS temporarily for testing
ALTER TABLE public.building_structures DISABLE ROW LEVEL SECURITY;

-- Verify the new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'building_structures' 
AND table_schema = 'public'
ORDER BY ordinal_position;