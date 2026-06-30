-- Add columns required by Land & Other Improvements Step 6.
-- Run once in the Supabase SQL editor if Step 6 save reports missing columns.

ALTER TABLE public.land_improvements
  ADD COLUMN IF NOT EXISTS tax_status                VARCHAR(20) DEFAULT 'taxable',
  ADD COLUMN IF NOT EXISTS appraised_by              UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS actual_use                VARCHAR(100),
  ADD COLUMN IF NOT EXISTS amount_in_words           TEXT,
  ADD COLUMN IF NOT EXISTS effectivity_of_assessment DATE,
  ADD COLUMN IF NOT EXISTS memoranda                 TEXT;
