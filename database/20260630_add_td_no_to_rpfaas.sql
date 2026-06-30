-- Add manual Tax Declaration number fields to the three RPFAAS record tables.

ALTER TABLE building_structures
  ADD COLUMN IF NOT EXISTS td_no VARCHAR(50);

ALTER TABLE land_improvements
  ADD COLUMN IF NOT EXISTS td_no VARCHAR(50);

ALTER TABLE machinery
  ADD COLUMN IF NOT EXISTS td_no VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_building_td_no ON building_structures(td_no);
CREATE INDEX IF NOT EXISTS idx_land_td_no ON land_improvements(td_no);
CREATE INDEX IF NOT EXISTS idx_machinery_td_no ON machinery(td_no);
