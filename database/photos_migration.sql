-- Run this once in the Supabase SQL editor
-- Creates the photo pointer table (no FK so it works regardless of
-- how building_structures.id was defined in your project).

CREATE TABLE IF NOT EXISTS building_structure_photos (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  building_structure_id INTEGER     NOT NULL,
  photo_type            TEXT        NOT NULL
                          CHECK (photo_type IN (
                            'sketch_plan',
                            'perspective_view',
                            'barangay_certificate',
                            'other_certificate'
                          )),
  storage_path          TEXT        NOT NULL,
  original_name         TEXT,
  uploaded_by           UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bsp_building_id ON building_structure_photos(building_structure_id);
CREATE INDEX IF NOT EXISTS idx_bsp_photo_type  ON building_structure_photos(photo_type); 

-- ── Row Level Security ────────────────────────────────────────────────────
ALTER TABLE building_structure_photos ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read photos
CREATE POLICY "Authenticated users can view photos"
  ON building_structure_photos FOR SELECT
  USING (auth.role() = 'authenticated');

-- INSERT: user may only insert rows where uploaded_by = their own uid
CREATE POLICY "Users can insert own photos"
  ON building_structure_photos FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- UPDATE: uploader or admin/super_admin only
CREATE POLICY "Users or admins can update photos"
  ON building_structure_photos FOR UPDATE
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'super_admin')
    )
  );

-- DELETE: uploader or admin/super_admin only
CREATE POLICY "Users or admins can delete photos"
  ON building_structure_photos FOR DELETE
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'super_admin')
    )
  );

-- NOTE: Create a private Storage bucket named  building-structure-photos
-- in the Supabase Dashboard → Storage → New bucket (Public = OFF).
