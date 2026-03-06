-- Add columns required by the building structures form (all steps)
-- Run this in the Supabase SQL Editor

ALTER TABLE public.building_structures
  -- Step 1
  ADD COLUMN IF NOT EXISTS location_province         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_municipality     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_barangay         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS owner_address_province    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS owner_address_municipality VARCHAR(100),
  ADD COLUMN IF NOT EXISTS owner_address_barangay    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS municipality              VARCHAR(100),

  -- Step 2
  ADD COLUMN IF NOT EXISTS cct                       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS completion_issued_on      DATE,
  ADD COLUMN IF NOT EXISTS building_age              INTEGER,
  ADD COLUMN IF NOT EXISTS floor_areas               JSONB,
  ADD COLUMN IF NOT EXISTS land_owner                VARCHAR(255),
  ADD COLUMN IF NOT EXISTS td_arp_no                 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS land_area                 DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS cost_of_construction      DECIMAL(15,2),

  -- Step 3 (materials stored as JSONB — checkboxes with summary)
  ADD COLUMN IF NOT EXISTS roofing_material          JSONB,
  ADD COLUMN IF NOT EXISTS flooring_material         JSONB,
  ADD COLUMN IF NOT EXISTS wall_material             JSONB,
  ADD COLUMN IF NOT EXISTS ceiling_material          JSONB,

  -- Step 4 (structural)
  ADD COLUMN IF NOT EXISTS foundation_type           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS electrical_system         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS plumbing_system           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS construction_type         VARCHAR(100),

  -- Step 6 (assessment)
  ADD COLUMN IF NOT EXISTS actual_use                VARCHAR(100),
  ADD COLUMN IF NOT EXISTS market_value              DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS assessment_level          DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS estimated_value           DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS amount_in_words           TEXT,
  ADD COLUMN IF NOT EXISTS effectivity_of_assessment DATE,
  ADD COLUMN IF NOT EXISTS selected_deductions       JSONB,
  ADD COLUMN IF NOT EXISTS unit_cost                 DECIMAL(15,2),

  -- Review workflow
  ADD COLUMN IF NOT EXISTS submitted_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS laoo_reviewer_id          UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS laoo_approved_at          TIMESTAMPTZ;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'building_structures'
  AND table_schema = 'public'
ORDER BY ordinal_position;
