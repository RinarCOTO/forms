-- ============================================================
-- MOUNTAIN PROVINCE — LOCATION REFERENCE DATA
-- Philippine Standard Geographic Code (PSGC) based
--
-- Run this in your Supabase SQL editor:
-- https://app.supabase.com/project/_/sql/new
--
-- NOTE: Codes use the 9-digit PSGC format (right column from
--       the official PSGC reference sheet).  Verify barangay
--       names / codes against the latest PSA PSGC publication
--       if exact official values are required.
-- ============================================================

-- ============================================================
-- 1. Create the locations reference table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.locations (
  psgc_code   VARCHAR(15)  PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  type        VARCHAR(15)  NOT NULL CHECK (type IN ('province', 'municipality', 'barangay')),
  parent_code VARCHAR(15)  REFERENCES public.locations(psgc_code),
  sort_order  INTEGER      DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_locations_parent ON public.locations(parent_code);
CREATE INDEX IF NOT EXISTS idx_locations_type   ON public.locations(type);

-- Enable RLS – read-only for all authenticated users
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read locations" ON public.locations;
CREATE POLICY "Authenticated users can read locations"
  ON public.locations FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- 2. Province
-- ============================================================
INSERT INTO public.locations (psgc_code, name, type, parent_code, sort_order) VALUES
  ('144400000', 'Mountain Province', 'province', NULL, 1)
ON CONFLICT (psgc_code) DO UPDATE SET name = EXCLUDED.name;

-- ============================================================
-- 3. Municipalities (10 municipalities of Mountain Province)
-- ============================================================
INSERT INTO public.locations (psgc_code, name, type, parent_code, sort_order) VALUES
  ('144401000', 'Barlig',    'municipality', '144400000',  1),
  ('144402000', 'Bauko',     'municipality', '144400000',  2),
  ('144403000', 'Besao',     'municipality', '144400000',  3),
  ('144404000', 'Bontoc',    'municipality', '144400000',  4),
  ('144405000', 'Natonin',   'municipality', '144400000',  5),
  ('144406000', 'Paracelis', 'municipality', '144400000',  6),
  ('144407000', 'Sabangan',  'municipality', '144400000',  7),
  ('144408000', 'Sadanga',   'municipality', '144400000',  8),
  ('144409000', 'Sagada',    'municipality', '144400000',  9),
  ('144410000', 'Tadian',    'municipality', '144400000', 10)
ON CONFLICT (psgc_code) DO UPDATE SET name = EXCLUDED.name;

-- ============================================================
-- 4. Barangays
-- ============================================================

-- ── Barlig (12 barangays) ────────────────────────────────────
INSERT INTO public.locations (psgc_code, name, type, parent_code, sort_order) VALUES
  ('144401001', 'Chupac',        'barangay', '144401000',  1),
  ('144401002', 'Fiangtin',      'barangay', '144401000',  2),
  ('144401003', 'Kaleo',         'barangay', '144401000',  3),
  ('144401004', 'Latang',        'barangay', '144401000',  4),
  ('144401005', 'Lenga',         'barangay', '144401000',  5),
  ('144401006', 'Lia Kanturan',  'barangay', '144401000',  6),
  ('144401007', 'Lingoy',        'barangay', '144401000',  7),
  ('144401008', 'Lunas',         'barangay', '144401000',  8),
  ('144401009', 'Macalana',      'barangay', '144401000',  9),
  ('144401010', 'Ogog',          'barangay', '144401000', 10),
  ('144401011', 'Poblacion',     'barangay', '144401000', 11),
  ('144401012', 'Lias Sitangan', 'barangay', '144401000', 12)
ON CONFLICT (psgc_code) DO UPDATE SET name = EXCLUDED.name;

-- ── Bauko (23 barangays) ─────────────────────────────────────
INSERT INTO public.locations (psgc_code, name, type, parent_code, sort_order) VALUES
  ('144402001', 'Abatan',            'barangay', '144402000',  1),
  ('144402002', 'Bagnen Oriente',    'barangay', '144402000',  2),
  ('144402003', 'Bagnen Proper',     'barangay', '144402000',  3),
  ('144402004', 'Balintaugan',       'barangay', '144402000',  4),
  ('144402005', 'Banao',             'barangay', '144402000',  5),
  ('144402006', 'Bila',              'barangay', '144402000',  6),
  ('144402007', 'Guinzadan Central', 'barangay', '144402000',  7),
  ('144402008', 'Guinzadan Norte',   'barangay', '144402000',  8),
  ('144402009', 'Guinzadan Sur',     'barangay', '144402000',  9),
  ('144402010', 'Lagawa',            'barangay', '144402000', 10),
  ('144402011', 'Leseb',             'barangay', '144402000', 11),
  ('144402012', 'Mabaay',            'barangay', '144402000', 12),
  ('144402013', 'Mayag',             'barangay', '144402000', 13),
  ('144402014', 'Monamon Norte',     'barangay', '144402000', 14),
  ('144402015', 'Monamon Sur',       'barangay', '144402000', 15),
  ('144402016', 'Mount Data',        'barangay', '144402000', 16),
  ('144402017', 'Nayudan',           'barangay', '144402000', 17),
  ('144402018', 'Okucan Norte',      'barangay', '144402000', 18),
  ('144402019', 'Okucan Sur',        'barangay', '144402000', 19),
  ('144402020', 'Poblacion',         'barangay', '144402000', 20),
  ('144402021', 'Sadsadan',          'barangay', '144402000', 21),
  ('144402022', 'Santa',             'barangay', '144402000', 22),
  ('144402023', 'Tappapan',          'barangay', '144402000', 23)
ON CONFLICT (psgc_code) DO UPDATE SET name = EXCLUDED.name;

-- ── Besao (14 barangays) ─────────────────────────────────────
INSERT INTO public.locations (psgc_code, name, type, parent_code, sort_order) VALUES
  ('144403001', 'Agawa',      'barangay', '144403000',  1),
  ('144403002', 'Ambaguio',   'barangay', '144403000',  2),
  ('144403003', 'Bangutan',   'barangay', '144403000',  3),
  ('144403004', 'Besao East', 'barangay', '144403000',  4),
  ('144403005', 'Besao West', 'barangay', '144403000',  5),
  ('144403006', 'Catengan',   'barangay', '144403000',  6),
  ('144403007', 'Gueday',     'barangay', '144403000',  7),
  ('144403008', 'Lacmaan',    'barangay', '144403000',  8),
  ('144403009', 'Laylaya',    'barangay', '144403000',  9),
  ('144403010', 'Padangan',   'barangay', '144403000', 10),
  ('144403011', 'Payeo',      'barangay', '144403000', 11),
  ('144403012', 'Suquib',     'barangay', '144403000', 12),
  ('144403013', 'Tamboan',    'barangay', '144403000', 13),
  ('144403014', 'Kiniway',    'barangay', '144403000', 14)
ON CONFLICT (psgc_code) DO UPDATE SET name = EXCLUDED.name;

-- ── Bontoc (16 barangays) ────────────────────────────────────
INSERT INTO public.locations (psgc_code, name, type, parent_code, sort_order) VALUES
  ('144404001', 'Alab Proper',  'barangay', '144404000',  1),
  ('144404002', 'Alab Oriente', 'barangay', '144404000',  2),
  ('144404003', 'Balili',       'barangay', '144404000',  3),
  ('144404004', 'Bagyao',       'barangay', '144404000',  4),
  ('144404005', 'Bontoc Ili',   'barangay', '144404000',  5),
  ('144404006', 'Caneo',        'barangay', '144404000',  6),
  ('144404007', 'Dalican',      'barangay', '144404000',  7),
  ('144404008', 'Gonogon',      'barangay', '144404000',  8),
  ('144404009', 'Guinaang',     'barangay', '144404000',  9),
  ('144404010', 'Mainit',       'barangay', '144404000', 10),
  ('144404011', 'Maligcong',    'barangay', '144404000', 11),
  ('144404012', 'Samoki',       'barangay', '144404000', 12),
  ('144404013', 'Talubin',      'barangay', '144404000', 13),
  ('144404014', 'Tocucan',      'barangay', '144404000', 14),
  ('144404015', 'Poblacion',    'barangay', '144404000', 15),
  ('144404016', 'Calutit',      'barangay', '144404000', 16)
ON CONFLICT (psgc_code) DO UPDATE SET name = EXCLUDED.name;

-- ── Natonin (11 barangays) ───────────────────────────────────
INSERT INTO public.locations (psgc_code, name, type, parent_code, sort_order) VALUES
  ('144405001', 'Alunogan',    'barangay', '144405000',  1),
  ('144405002', 'Belangen',    'barangay', '144405000',  2),
  ('144405003', 'Banao',       'barangay', '144405000',  3),
  ('144405004', 'Banawal',     'barangay', '144405000',  4),
  ('144405005', 'Butac',       'barangay', '144405000',  5),
  ('144405006', 'Maducayan',   'barangay', '144405000',  6),
  ('144405007', 'Poblacion',   'barangay', '144405000',  7),
  ('144405008', 'Saklok',      'barangay', '144405000',  8),
  ('144405009', 'Sta. Isabel', 'barangay', '144405000',  9),
  ('144405010', 'Tonglayan',   'barangay', '144405000', 10),
  ('144405011', 'Pudo',        'barangay', '144405000', 11)
ON CONFLICT (psgc_code) DO UPDATE SET name = EXCLUDED.name;

-- ── Paracelis (9 barangays) ──────────────────────────────────
INSERT INTO public.locations (psgc_code, name, type, parent_code, sort_order) VALUES
  ('144406001', 'Banat',     'barangay', '144406000', 1),
  ('144406002', 'Bacami',    'barangay', '144406000', 2),
  ('144406003', 'Bananao',   'barangay', '144406000', 3),
  ('144406004', 'Bantay',    'barangay', '144406000', 4),
  ('144406005', 'Bunique',   'barangay', '144406000', 5),
  ('144406006', 'Bunot',     'barangay', '144406000', 6),
  ('144406007', 'Buringal',  'barangay', '144406000', 7),
  ('144406008', 'Palitod',   'barangay', '144406000', 8),
  ('144406009', 'Poblacion', 'barangay', '144406000', 9)
ON CONFLICT (psgc_code) DO UPDATE SET name = EXCLUDED.name;

-- ── Sabangan (15 barangays) ──────────────────────────────────
INSERT INTO public.locations (psgc_code, name, type, parent_code, sort_order) VALUES
  ('144407001', 'Bao-angan', 'barangay', '144407000',  1),
  ('144407002', 'Bun-ayan',  'barangay', '144407000',  2),
  ('144407003', 'Busa',      'barangay', '144407000',  3),
  ('144407004', 'Camatagan', 'barangay', '144407000',  4),
  ('144407005', 'Capinitan', 'barangay', '144407000',  5),
  ('144407006', 'Data',      'barangay', '144407000',  6),
  ('144407007', 'Gayang',    'barangay', '144407000',  7),
  ('144407008', 'Lagan',     'barangay', '144407000',  8),
  ('144407009', 'Losad',     'barangay', '144407000',  9),
  ('144407010', 'Namatec',   'barangay', '144407000', 10),
  ('144407011', 'Napua',     'barangay', '144407000', 11),
  ('144407012', 'Pingad',    'barangay', '144407000', 12),
  ('144407013', 'Poblacion', 'barangay', '144407000', 13),
  ('144407014', 'Supang',    'barangay', '144407000', 14),
  ('144407015', 'Tambingan', 'barangay', '144407000', 15)
ON CONFLICT (psgc_code) DO UPDATE SET name = EXCLUDED.name;

-- ── Sadanga (8 barangays) ────────────────────────────────────
INSERT INTO public.locations (psgc_code, name, type, parent_code, sort_order) VALUES
  ('144408001', 'Anabel',    'barangay', '144408000', 1),
  ('144408002', 'Belwang',   'barangay', '144408000', 2),
  ('144408003', 'Betwagan',  'barangay', '144408000', 3),
  ('144408004', 'Bekigan',   'barangay', '144408000', 4),
  ('144408005', 'Poblacion', 'barangay', '144408000', 5),
  ('144408006', 'Sacasacan', 'barangay', '144408000', 6),
  ('144408007', 'Saclit',    'barangay', '144408000', 7),
  ('144408008', 'Demang',    'barangay', '144408000', 8)
ON CONFLICT (psgc_code) DO UPDATE SET name = EXCLUDED.name;

-- ── Sagada (19 barangays) ────────────────────────────────────
INSERT INTO public.locations (psgc_code, name, type, parent_code, sort_order) VALUES
  ('144409001', 'Aguid',         'barangay', '144409000',  1),
  ('144409002', 'Ambasing',      'barangay', '144409000',  2),
  ('144409003', 'Angkeleg',      'barangay', '144409000',  3),
  ('144409004', 'Antadao',       'barangay', '144409000',  4),
  ('144409005', 'Balugan',       'barangay', '144409000',  5),
  ('144409006', 'Bangaan',       'barangay', '144409000',  6),
  ('144409007', 'Dagdag',        'barangay', '144409000',  7),
  ('144409008', 'Demang',        'barangay', '144409000',  8),
  ('144409009', 'Fidelisan',     'barangay', '144409000',  9),
  ('144409010', 'Kilong',        'barangay', '144409000', 10),
  ('144409011', 'Madongo',       'barangay', '144409000', 11),
  ('144409012', 'Nacagaon',      'barangay', '144409000', 12),
  ('144409013', 'Pide',          'barangay', '144409000', 13),
  ('144409014', 'Poblacion',     'barangay', '144409000', 14),
  ('144409015', 'Suyo',          'barangay', '144409000', 15),
  ('144409016', 'Tanulong',      'barangay', '144409000', 16),
  ('144409017', 'Tetepan Norte', 'barangay', '144409000', 17),
  ('144409018', 'Tetepan Sur',   'barangay', '144409000', 18),
  ('144409019', 'Ubongen',       'barangay', '144409000', 19)
ON CONFLICT (psgc_code) DO UPDATE SET name = EXCLUDED.name;

-- ── Tadian (19 barangays) ────────────────────────────────────
INSERT INTO public.locations (psgc_code, name, type, parent_code, sort_order) VALUES
  ('144410001', 'Balaoa',      'barangay', '144410000',  1),
  ('144410002', 'Banaao',      'barangay', '144410000',  2),
  ('144410003', 'Bantay',      'barangay', '144410000',  3),
  ('144410004', 'Bila',        'barangay', '144410000',  4),
  ('144410005', 'Bunga',       'barangay', '144410000',  5),
  ('144410006', 'Cadatanyan',  'barangay', '144410000',  6),
  ('144410007', 'Cogutban',    'barangay', '144410000',  7),
  ('144410008', 'Dacodac',     'barangay', '144410000',  8),
  ('144410009', 'Duagan',      'barangay', '144410000',  9),
  ('144410010', 'Kayan East',  'barangay', '144410000', 10),
  ('144410011', 'Lenga',       'barangay', '144410000', 11),
  ('144410012', 'Lubon',       'barangay', '144410000', 12),
  ('144410013', 'Mabalie',     'barangay', '144410000', 13),
  ('144410014', 'Masla',       'barangay', '144410000', 14),
  ('144410015', 'Poblacion',   'barangay', '144410000', 15),
  ('144410016', 'Poblayan',    'barangay', '144410000', 16),
  ('144410017', 'Sumadel',     'barangay', '144410000', 17),
  ('144410018', 'Tuc',         'barangay', '144410000', 18),
  ('144410019', 'Kayan West',  'barangay', '144410000', 19)
ON CONFLICT (psgc_code) DO UPDATE SET name = EXCLUDED.name;

-- ============================================================
-- Done! Summary:
--   Province : 1
--   Municipalities: 10
--   Barangays : 161
--     Barlig    12  |  Bauko     23  |  Besao    14
--     Bontoc    16  |  Natonin   11  |  Paracelis 9
--     Sabangan  15  |  Sadanga    8  |  Sagada   19
--     Tadian    19
--
-- Next steps:
--   1. Run this SQL in the Supabase SQL editor
--   2. Update frontend dropdowns to query public.locations
--      or use the TypeScript constants in locations.ts
-- ============================================================

-- ============================================================
-- Add location name columns to data tables
-- These store the human-readable municipality/barangay/province
-- names that are resolved from the PSGC codes at save time.
-- Run this after LOCATION_DATA.sql if not already applied.
-- ============================================================

ALTER TABLE public.building_structures
  ADD COLUMN IF NOT EXISTS location_province    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_municipality VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_barangay    VARCHAR(100);

ALTER TABLE public.land_improvements
  ADD COLUMN IF NOT EXISTS location_province    VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_municipality VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_barangay    VARCHAR(100);
