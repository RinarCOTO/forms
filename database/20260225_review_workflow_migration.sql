-- ============================================================
-- Review Workflow Migration
-- Run once in the Supabase SQL editor.
--
-- What this migration does:
--   1.  Extends users table  (municipality, laoo_level)
--   2.  Extends FAAS tables  (building_structures, land_improvements, machinery)
--   3.  Creates form_comments          – LAOO comments + tax mapper replies
--   4.  Creates form_attachments       – documents for either party
--   5.  Creates tax_declarations       – unlocked when FAAS is approved
--   6.  Creates form_review_history    – full audit trail of every status change
--   7.  Renames municipal_tax_mapper   → municipal_assessor in role_permissions
--   8.  Seeds permissions for new roles: laoo, assistant_provincial_assessor,
--       provincial_assessor; adds new features: forms.submit, review.laoo, review.sign
--   9.  Applies RLS and grants
-- ============================================================


-- ── 1. Extend users table ────────────────────────────────────────────────────
-- municipality : scopes LAOO and municipal_assessor to their own municipality.
--               NULL = province-wide access (PA, APA, admin, super_admin).
-- laoo_level   : informational (1–4), NULL for all non-LAOO roles.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS municipality TEXT,
  ADD COLUMN IF NOT EXISTS laoo_level   SMALLINT
    CHECK (laoo_level IS NULL OR laoo_level BETWEEN 1 AND 4);

CREATE INDEX IF NOT EXISTS idx_users_municipality ON users(municipality);


-- ── 2. Extend FAAS tables ────────────────────────────────────────────────────
-- FAAS status values (replaces the old draft/pending/approved/rejected set):
--   draft | submitted | under_review | returned | approved
--
-- NOTE: location_municipality / location_barangay are assumed to already exist
--       on building_structures and land_improvements (added in earlier migrations).
--       They are the fields used to scope LAOO review access.

ALTER TABLE building_structures
  ADD COLUMN IF NOT EXISTS submitted_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS laoo_reviewer_id   UUID,          -- which LAOO picked it up
  ADD COLUMN IF NOT EXISTS laoo_approved_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tax_declaration_id UUID;          -- set when Tax Declaration is created

ALTER TABLE land_improvements
  ADD COLUMN IF NOT EXISTS submitted_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS laoo_reviewer_id   UUID,
  ADD COLUMN IF NOT EXISTS laoo_approved_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tax_declaration_id UUID;

ALTER TABLE machinery
  ADD COLUMN IF NOT EXISTS submitted_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS laoo_reviewer_id   UUID,
  ADD COLUMN IF NOT EXISTS laoo_approved_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tax_declaration_id UUID;

CREATE INDEX IF NOT EXISTS idx_building_submitted_at  ON building_structures(submitted_at);
CREATE INDEX IF NOT EXISTS idx_building_laoo_reviewer ON building_structures(laoo_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_land_submitted_at      ON land_improvements(submitted_at);
CREATE INDEX IF NOT EXISTS idx_land_laoo_reviewer     ON land_improvements(laoo_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_machinery_submitted_at ON machinery(submitted_at);


-- ── 3. form_comments ──────────────────────────────────────────────────────────
-- LAOO leaves per-field comments (and optional suggested values) on a FAAS form.
-- Tax mapper replies via parent_id (threaded conversation per field).
-- is_resolved is flipped to true once both parties settle on the field value.

CREATE TABLE IF NOT EXISTS form_comments (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type        TEXT        NOT NULL
                     CHECK (form_type IN (
                       'building_structures',
                       'land_improvements',
                       'machinery'
                     )),
  form_id          INTEGER     NOT NULL,
  field_name       TEXT,                              -- NULL = general / whole-form comment
  comment_text     TEXT        NOT NULL,
  suggested_value  TEXT,                              -- LAOO may attach a suggested replacement
  author_id        UUID        NOT NULL,              -- auth.uid() of the commenter
  author_role      TEXT        NOT NULL
                     CHECK (author_role IN (
                       'laoo',
                       'tax_mapper',
                       'municipal_assessor',
                       'admin',
                       'super_admin'
                     )),
  parent_id        UUID        REFERENCES form_comments(id) ON DELETE CASCADE,
  is_resolved      BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fc_form        ON form_comments(form_type, form_id);
CREATE INDEX IF NOT EXISTS idx_fc_field       ON form_comments(form_type, form_id, field_name);
CREATE INDEX IF NOT EXISTS idx_fc_parent      ON form_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_fc_author      ON form_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_fc_unresolved  ON form_comments(form_type, form_id, is_resolved)
  WHERE is_resolved = false;


-- ── 4. form_attachments ───────────────────────────────────────────────────────
-- Documents uploaded by LAOO or tax mapper in support of a comment,
-- or by PA/APA when signing off on a Tax Declaration.
-- Exactly one of (comment_id, tax_declaration_id) should be set; the other NULL.

CREATE TABLE IF NOT EXISTS form_attachments (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type           TEXT        NOT NULL
                        CHECK (form_type IN (
                          'building_structures',
                          'land_improvements',
                          'machinery',
                          'tax_declarations'
                        )),
  form_id             INTEGER,                        -- set for FAAS attachments
  tax_declaration_id  UUID,                           -- set for Tax Declaration attachments
  comment_id          UUID        REFERENCES form_comments(id) ON DELETE SET NULL,
  uploaded_by         UUID        NOT NULL,
  uploader_role       TEXT        NOT NULL,
  file_name           TEXT        NOT NULL,
  file_path           TEXT        NOT NULL,           -- Supabase Storage path
  file_size           INTEGER,
  uploaded_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fa_form           ON form_attachments(form_type, form_id);
CREATE INDEX IF NOT EXISTS idx_fa_tax_decl       ON form_attachments(tax_declaration_id);
CREATE INDEX IF NOT EXISTS idx_fa_comment        ON form_attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_fa_uploader       ON form_attachments(uploaded_by);


-- ── 5. tax_declarations ───────────────────────────────────────────────────────
-- Created automatically (by the API) when a FAAS is approved by LAOO.
-- Tax mapper fills in any additional Tax Declaration fields, then it
-- moves to for_signature where the PA or APA attaches their e-signature.
--
-- Status flow:  unlocked → completed → for_signature → finalized
--
-- property_snapshot: JSONB copy of the FAAS record at the moment of LAOO approval.
--   Ensures the Tax Declaration always reflects the approved values even if the
--   FAAS record is later audited or archived.

CREATE TABLE IF NOT EXISTS tax_declarations (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type           TEXT        NOT NULL
                        CHECK (form_type IN (
                          'building_structures',
                          'land_improvements',
                          'machinery'
                        )),
  form_id             INTEGER     NOT NULL,           -- references the approved FAAS row
  tax_declaration_no  TEXT        UNIQUE,             -- generated: e.g. TD-2026-00001
  property_snapshot   JSONB,                          -- approved FAAS values at approval time
  status              TEXT        NOT NULL DEFAULT 'unlocked'
                        CHECK (status IN (
                          'unlocked',        -- ready for tax mapper to fill
                          'completed',       -- tax mapper submitted Tax Declaration
                          'for_signature',   -- in PA / APA queue
                          'finalized'        -- e-signed and locked
                        )),
  completed_by        UUID,                           -- tax mapper who filled it
  completed_at        TIMESTAMPTZ,
  signed_by           UUID,                           -- provincial_assessor or assistant_provincial_assessor
  signed_at           TIMESTAMPTZ,
  signature_data      TEXT,                           -- e-signature storage path
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_td_form      ON tax_declarations(form_type, form_id);
CREATE INDEX IF NOT EXISTS idx_td_status    ON tax_declarations(status);
CREATE INDEX IF NOT EXISTS idx_td_signed_by ON tax_declarations(signed_by);


-- ── 6. form_review_history ───────────────────────────────────────────────────
-- Immutable audit log. One row per status transition on either
-- a FAAS form or a Tax Declaration. Never update or delete rows here.

CREATE TABLE IF NOT EXISTS form_review_history (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  form_type    TEXT        NOT NULL,
  form_id      INTEGER,                               -- set for FAAS
  form_stage   TEXT        NOT NULL
                 CHECK (form_stage IN ('faas', 'tax_declaration')),
  td_id        UUID,                                  -- set for Tax Declaration history rows
  from_status  TEXT,                                  -- NULL on first submission
  to_status    TEXT        NOT NULL,
  actor_id     UUID,
  actor_role   TEXT,
  note         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_frh_form    ON form_review_history(form_type, form_id);
CREATE INDEX IF NOT EXISTS idx_frh_td      ON form_review_history(td_id);
CREATE INDEX IF NOT EXISTS idx_frh_actor   ON form_review_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_frh_created ON form_review_history(created_at DESC);


-- ── 7. Auto-update triggers for new tables ────────────────────────────────────
-- update_updated_at_column() already exists from schema.sql; reuse it here.

CREATE TRIGGER trg_form_comments_updated_at
  BEFORE UPDATE ON form_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tax_declarations_updated_at
  BEFORE UPDATE ON tax_declarations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── 8. Role permissions ───────────────────────────────────────────────────────

-- 8a. Rename municipal_tax_mapper → municipal_assessor
UPDATE role_permissions
  SET role = 'municipal_assessor'
  WHERE role = 'municipal_tax_mapper';

-- 8b. Seed three new roles
--     New permission features introduced:
--       forms.submit  – who can submit a FAAS for LAOO review
--       review.laoo   – who can open, comment on, return, or approve a FAAS
--       review.sign   – who can attach an e-signature to a Tax Declaration

INSERT INTO role_permissions (role, feature, allowed) VALUES

  -- ── laoo ──────────────────────────────────────────────────────────────────
  -- Provincial-level reviewer. Can view forms from all municipalities.
  -- Cannot create, edit, or delete FAAS entries (review only).
  ('laoo', 'building_structures.view',   true),
  ('laoo', 'building_structures.create', false),
  ('laoo', 'building_structures.edit',   false),
  ('laoo', 'building_structures.delete', false),
  ('laoo', 'land_improvements.view',     true),
  ('laoo', 'land_improvements.create',   false),
  ('laoo', 'land_improvements.edit',     false),
  ('laoo', 'land_improvements.delete',   false),
  ('laoo', 'machinery.view',             true),
  ('laoo', 'machinery.create',           false),
  ('laoo', 'machinery.edit',             false),
  ('laoo', 'machinery.delete',           false),
  ('laoo', 'accounting.view',            false),
  ('laoo', 'user_management.view',       false),
  ('laoo', 'user_management.create',     false),
  ('laoo', 'user_management.edit',       false),
  ('laoo', 'user_management.delete',     false),
  ('laoo', 'role_management.view',       false),
  ('laoo', 'role_management.edit',       false),
  ('laoo', 'dashboard.view',             true),
  ('laoo', 'forms.submit',               false),
  ('laoo', 'review.laoo',                true),
  ('laoo', 'review.sign',                false),

  -- ── assistant_provincial_assessor ─────────────────────────────────────────
  -- Provincial level. Can view all forms and sign Tax Declarations.
  -- Cannot create/edit/delete FAAS entries.
  ('assistant_provincial_assessor', 'building_structures.view',   true),
  ('assistant_provincial_assessor', 'building_structures.create', false),
  ('assistant_provincial_assessor', 'building_structures.edit',   false),
  ('assistant_provincial_assessor', 'building_structures.delete', false),
  ('assistant_provincial_assessor', 'land_improvements.view',     true),
  ('assistant_provincial_assessor', 'land_improvements.create',   false),
  ('assistant_provincial_assessor', 'land_improvements.edit',     false),
  ('assistant_provincial_assessor', 'land_improvements.delete',   false),
  ('assistant_provincial_assessor', 'machinery.view',             true),
  ('assistant_provincial_assessor', 'machinery.create',           false),
  ('assistant_provincial_assessor', 'machinery.edit',             false),
  ('assistant_provincial_assessor', 'machinery.delete',           false),
  ('assistant_provincial_assessor', 'accounting.view',            false),
  ('assistant_provincial_assessor', 'user_management.view',       false),
  ('assistant_provincial_assessor', 'user_management.create',     false),
  ('assistant_provincial_assessor', 'user_management.edit',       false),
  ('assistant_provincial_assessor', 'user_management.delete',     false),
  ('assistant_provincial_assessor', 'role_management.view',       false),
  ('assistant_provincial_assessor', 'role_management.edit',       false),
  ('assistant_provincial_assessor', 'dashboard.view',             true),
  ('assistant_provincial_assessor', 'forms.submit',               false),
  ('assistant_provincial_assessor', 'review.laoo',                false),
  ('assistant_provincial_assessor', 'review.sign',                true),

  -- ── provincial_assessor ───────────────────────────────────────────────────
  -- Highest provincial authority. Same access as APA.
  ('provincial_assessor', 'building_structures.view',   true),
  ('provincial_assessor', 'building_structures.create', false),
  ('provincial_assessor', 'building_structures.edit',   false),
  ('provincial_assessor', 'building_structures.delete', false),
  ('provincial_assessor', 'land_improvements.view',     true),
  ('provincial_assessor', 'land_improvements.create',   false),
  ('provincial_assessor', 'land_improvements.edit',     false),
  ('provincial_assessor', 'land_improvements.delete',   false),
  ('provincial_assessor', 'machinery.view',             true),
  ('provincial_assessor', 'machinery.create',           false),
  ('provincial_assessor', 'machinery.edit',             false),
  ('provincial_assessor', 'machinery.delete',           false),
  ('provincial_assessor', 'accounting.view',            false),
  ('provincial_assessor', 'user_management.view',       false),
  ('provincial_assessor', 'user_management.create',     false),
  ('provincial_assessor', 'user_management.edit',       false),
  ('provincial_assessor', 'user_management.delete',     false),
  ('provincial_assessor', 'role_management.view',       false),
  ('provincial_assessor', 'role_management.edit',       false),
  ('provincial_assessor', 'dashboard.view',             true),
  ('provincial_assessor', 'forms.submit',               false),
  ('provincial_assessor', 'review.laoo',                false),
  ('provincial_assessor', 'review.sign',                true)

ON CONFLICT (role, feature) DO NOTHING;

-- 8c. Add new features to all existing roles
--     ON CONFLICT DO NOTHING means existing rows are untouched.
INSERT INTO role_permissions (role, feature, allowed) VALUES
  ('super_admin',        'forms.submit', true),
  ('super_admin',        'review.laoo',  true),    -- super_admin can do anything
  ('super_admin',        'review.sign',  true),

  ('admin',              'forms.submit', true),
  ('admin',              'review.laoo',  false),
  ('admin',              'review.sign',  false),

  ('tax_mapper',         'forms.submit', true),
  ('tax_mapper',         'review.laoo',  false),
  ('tax_mapper',         'review.sign',  false),

  -- municipal_assessor (was municipal_tax_mapper; already renamed above)
  ('municipal_assessor', 'forms.submit', true),
  ('municipal_assessor', 'review.laoo',  false),
  ('municipal_assessor', 'review.sign',  false),

  ('accountant',         'forms.submit', false),
  ('accountant',         'review.laoo',  false),
  ('accountant',         'review.sign',  false),

  ('user',               'forms.submit', false),
  ('user',               'review.laoo',  false),
  ('user',               'review.sign',  false)

ON CONFLICT (role, feature) DO NOTHING;


-- ── 9. Row Level Security ─────────────────────────────────────────────────────

-- form_comments: all authenticated users can read; authors insert/update own rows
ALTER TABLE form_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read form comments"
  ON form_comments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authors can insert form comments"
  ON form_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own form comments"
  ON form_comments FOR UPDATE
  USING (auth.uid() = author_id);


-- form_attachments: all authenticated users can read; uploader inserts own rows
ALTER TABLE form_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read form attachments"
  ON form_attachments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own form attachments"
  ON form_attachments FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);


-- tax_declarations: all authenticated users can read; write goes through service_role API
ALTER TABLE tax_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tax declarations"
  ON tax_declarations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role manages tax declarations"
  ON tax_declarations FOR ALL
  USING (true)                         -- service_role bypasses RLS; policy is a safety net
  WITH CHECK (true);


-- form_review_history: authenticated users can read; insert through service_role API only
ALTER TABLE form_review_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read review history"
  ON form_review_history FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role manages review history"
  ON form_review_history FOR ALL
  USING (true)
  WITH CHECK (true);


-- ── 10. Grants ────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE         ON TABLE form_comments        TO authenticated;
GRANT SELECT, INSERT                 ON TABLE form_attachments     TO authenticated;
GRANT SELECT                         ON TABLE tax_declarations     TO authenticated;
GRANT SELECT                         ON TABLE form_review_history  TO authenticated;

GRANT ALL ON TABLE form_comments        TO service_role;
GRANT ALL ON TABLE form_attachments     TO service_role;
GRANT ALL ON TABLE tax_declarations     TO service_role;
GRANT ALL ON TABLE form_review_history  TO service_role;


-- ── Summary of status values after this migration ────────────────────────────
--
-- FAAS (building_structures / land_improvements / machinery):
--   draft          – tax mapper is still filling the form
--   submitted      – submitted to LAOO review queue (also used for re-submissions)
--   under_review   – a LAOO has opened the form
--   returned       – LAOO returned with comments; tax mapper must respond
--   approved       – LAOO approved; Tax Declaration auto-created (status = unlocked)
--
-- Tax Declaration (tax_declarations):
--   unlocked       – waiting for tax mapper to complete
--   completed      – tax mapper submitted; in PA / APA signature queue
--   for_signature  – PA or APA has it open (optional intermediate state)
--   finalized      – e-signed and locked; tax mapper can print
--
-- ─────────────────────────────────────────────────────────────────────────────
-- Storage buckets to create in Supabase Dashboard → Storage:
--   form-attachments   (Private)  – stores LAOO / tax mapper supporting documents
-- ─────────────────────────────────────────────────────────────────────────────
