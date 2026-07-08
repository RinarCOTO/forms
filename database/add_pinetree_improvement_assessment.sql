-- Adds an optional, separate assessment level for "Other Improvements" (currently
-- used for Pinetree Land). Most municipalities don't assess improvements at a
-- separate rate from the land itself, so this is opt-in: when
-- improvement_assessment_level is left blank/null, Step 6 computes Assessed Value
-- exactly as before (one combined market_value x the land's own rate). Only when an
-- assessor explicitly types a rate for a Pinetree Land draft does the blended
-- formula (land value x land rate + improvement value x improvement rate) kick in.
-- Run this in the Supabase SQL Editor.

ALTER TABLE public.land_improvements
  ADD COLUMN IF NOT EXISTS land_market_value           DECIMAL(15,2), -- land-only value, pre-improvement
  ADD COLUMN IF NOT EXISTS improvement_market_value     DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS improvement_assessment_level DECIMAL(5,2);

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'land_improvements'
  AND table_schema = 'public'
  AND column_name IN ('land_market_value', 'improvement_market_value', 'improvement_assessment_level');
