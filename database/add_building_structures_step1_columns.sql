-- Add Step 1 Property Identification columns to building_structures
-- Run this in the Supabase SQL Editor

ALTER TABLE public.building_structures
  ADD COLUMN IF NOT EXISTS transaction_code   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS arp_no             VARCHAR(20),
  ADD COLUMN IF NOT EXISTS oct_tct_cloa_no    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pin                VARCHAR(100),
  ADD COLUMN IF NOT EXISTS survey_no          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS lot_no             VARCHAR(100),
  ADD COLUMN IF NOT EXISTS blk                INTEGER;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'building_structures'
  AND table_schema = 'public'
ORDER BY ordinal_position;
