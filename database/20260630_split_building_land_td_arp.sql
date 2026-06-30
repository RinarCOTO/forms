-- Split the building Step 2 land reference number into separate TD and ARP fields.

ALTER TABLE building_structures
  ADD COLUMN IF NOT EXISTS land_td_no VARCHAR(100),
  ADD COLUMN IF NOT EXISTS land_arp_no VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_building_land_td_no ON building_structures(land_td_no);
CREATE INDEX IF NOT EXISTS idx_building_land_arp_no ON building_structures(land_arp_no);
