-- Add columns required by the land improvements form (all steps)
-- Run this in the Supabase SQL Editor

ALTER TABLE public.land_improvements
  -- Step 1 (Owner / Property Info)
  ADD COLUMN IF NOT EXISTS transaction_code          VARCHAR(100),
  ADD COLUMN IF NOT EXISTS oct_tct_cloa_no           VARCHAR(100),
  ADD COLUMN IF NOT EXISTS survey_no                 VARCHAR(100),
  ADD COLUMN IF NOT EXISTS lot_no                    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS blk                       VARCHAR(50),
  ADD COLUMN IF NOT EXISTS property_address          TEXT,
  ADD COLUMN IF NOT EXISTS location_province         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_municipality     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_barangay         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS municipality              VARCHAR(100),
  ADD COLUMN IF NOT EXISTS admin_care_of             VARCHAR(255),
  ADD COLUMN IF NOT EXISTS admin_address             TEXT,
  ADD COLUMN IF NOT EXISTS owner_province_code       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS owner_municipality_code   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS owner_barangay_code       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS admin_province_code       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS admin_municipality_code   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS admin_barangay_code       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS property_province_code    VARCHAR(20),
  ADD COLUMN IF NOT EXISTS property_municipality_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS property_barangay_code    VARCHAR(20),

  -- Step 2 (Boundaries)
  ADD COLUMN IF NOT EXISTS north_property            TEXT,
  ADD COLUMN IF NOT EXISTS south_property            TEXT,
  ADD COLUMN IF NOT EXISTS east_property             TEXT,
  ADD COLUMN IF NOT EXISTS west_property             TEXT,

  -- Step 3 (Appraisal)
  ADD COLUMN IF NOT EXISTS classification            VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sub_classification        VARCHAR(100),
  ADD COLUMN IF NOT EXISTS land_class                VARCHAR(50),
  ADD COLUMN IF NOT EXISTS unit_value                DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS land_area                 DECIMAL(15,4),
  ADD COLUMN IF NOT EXISTS base_market_value         DECIMAL(15,2),

  -- Step 4 (Improvements / Adjustments)
  ADD COLUMN IF NOT EXISTS selected_deductions       JSONB,
  ADD COLUMN IF NOT EXISTS improvement_kind          JSONB,
  ADD COLUMN IF NOT EXISTS quantities                JSONB,
  ADD COLUMN IF NOT EXISTS overall_comments          TEXT,
  ADD COLUMN IF NOT EXISTS additional_percentage_choice   TEXT,
  ADD COLUMN IF NOT EXISTS additional_percentage_value    DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS additional_percentage_areas    JSONB,
  ADD COLUMN IF NOT EXISTS additional_flat_rate_choice    TEXT,
  ADD COLUMN IF NOT EXISTS additional_flat_rate_value     DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS additional_flat_rate_areas     JSONB,

  -- Step 5 (Assessment)
  ADD COLUMN IF NOT EXISTS actual_use                VARCHAR(100),
  ADD COLUMN IF NOT EXISTS amount_in_words           TEXT,
  ADD COLUMN IF NOT EXISTS effectivity_of_assessment DATE,
  ADD COLUMN IF NOT EXISTS memoranda                 TEXT,

  -- Review workflow
  ADD COLUMN IF NOT EXISTS submitted_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS laoo_reviewer_id          UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS laoo_approved_at          TIMESTAMPTZ;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'land_improvements'
  AND table_schema = 'public'
ORDER BY ordinal_position;
