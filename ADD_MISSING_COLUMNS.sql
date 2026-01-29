-- Add missing columns to building_structures table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE building_structures
ADD COLUMN IF NOT EXISTS admin_care_of VARCHAR(255),
ADD COLUMN IF NOT EXISTS admin_address TEXT,
ADD COLUMN IF NOT EXISTS property_address TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'building_structures'
ORDER BY ordinal_position;
