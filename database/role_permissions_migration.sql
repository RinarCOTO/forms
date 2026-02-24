-- Role Permissions Table
-- Run this once in the Supabase SQL editor.
-- Stores a boolean flag per (role, feature) pair.
-- If a row is missing the application falls back to DEFAULT_PERMISSIONS constants.

CREATE TABLE IF NOT EXISTS role_permissions (
  role        TEXT        NOT NULL,
  feature     TEXT        NOT NULL,
  allowed     BOOLEAN     NOT NULL DEFAULT false,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (role, feature)
);

-- ── Seed default permissions ──────────────────────────────────────────────────
-- Reflects the access rules currently hard-coded in the sidebar and API routes.

INSERT INTO role_permissions (role, feature, allowed) VALUES
  -- super_admin: full access (locked in UI, always true)
  ('super_admin', 'building_structures.view',   true),
  ('super_admin', 'building_structures.create', true),
  ('super_admin', 'building_structures.edit',   true),
  ('super_admin', 'building_structures.delete', true),
  ('super_admin', 'land_improvements.view',     true),
  ('super_admin', 'land_improvements.create',   true),
  ('super_admin', 'land_improvements.edit',     true),
  ('super_admin', 'land_improvements.delete',   true),
  ('super_admin', 'machinery.view',             true),
  ('super_admin', 'machinery.create',           true),
  ('super_admin', 'machinery.edit',             true),
  ('super_admin', 'machinery.delete',           true),
  ('super_admin', 'accounting.view',            true),
  ('super_admin', 'user_management.view',       true),
  ('super_admin', 'user_management.create',     true),
  ('super_admin', 'user_management.edit',       true),
  ('super_admin', 'user_management.delete',     true),
  ('super_admin', 'role_management.view',       true),
  ('super_admin', 'role_management.edit',       true),
  ('super_admin', 'dashboard.view',             true),

  -- admin
  ('admin', 'building_structures.view',   true),
  ('admin', 'building_structures.create', true),
  ('admin', 'building_structures.edit',   true),
  ('admin', 'building_structures.delete', true),
  ('admin', 'land_improvements.view',     true),
  ('admin', 'land_improvements.create',   true),
  ('admin', 'land_improvements.edit',     true),
  ('admin', 'land_improvements.delete',   true),
  ('admin', 'machinery.view',             true),
  ('admin', 'machinery.create',           true),
  ('admin', 'machinery.edit',             true),
  ('admin', 'machinery.delete',           true),
  ('admin', 'accounting.view',            true),
  ('admin', 'user_management.view',       true),
  ('admin', 'user_management.create',     true),
  ('admin', 'user_management.edit',       true),
  ('admin', 'user_management.delete',     true),
  ('admin', 'role_management.view',       false),
  ('admin', 'role_management.edit',       false),
  ('admin', 'dashboard.view',             true),

  -- tax_mapper
  ('tax_mapper', 'building_structures.view',   true),
  ('tax_mapper', 'building_structures.create', true),
  ('tax_mapper', 'building_structures.edit',   true),
  ('tax_mapper', 'building_structures.delete', false),
  ('tax_mapper', 'land_improvements.view',     true),
  ('tax_mapper', 'land_improvements.create',   true),
  ('tax_mapper', 'land_improvements.edit',     true),
  ('tax_mapper', 'land_improvements.delete',   false),
  ('tax_mapper', 'machinery.view',             true),
  ('tax_mapper', 'machinery.create',           true),
  ('tax_mapper', 'machinery.edit',             true),
  ('tax_mapper', 'machinery.delete',           false),
  ('tax_mapper', 'accounting.view',            false),
  ('tax_mapper', 'user_management.view',       false),
  ('tax_mapper', 'user_management.create',     false),
  ('tax_mapper', 'user_management.edit',       false),
  ('tax_mapper', 'user_management.delete',     false),
  ('tax_mapper', 'role_management.view',       false),
  ('tax_mapper', 'role_management.edit',       false),
  ('tax_mapper', 'dashboard.view',             true),

  -- municipal_tax_mapper
  ('municipal_tax_mapper', 'building_structures.view',   true),
  ('municipal_tax_mapper', 'building_structures.create', true),
  ('municipal_tax_mapper', 'building_structures.edit',   true),
  ('municipal_tax_mapper', 'building_structures.delete', false),
  ('municipal_tax_mapper', 'land_improvements.view',     true),
  ('municipal_tax_mapper', 'land_improvements.create',   true),
  ('municipal_tax_mapper', 'land_improvements.edit',     true),
  ('municipal_tax_mapper', 'land_improvements.delete',   false),
  ('municipal_tax_mapper', 'machinery.view',             true),
  ('municipal_tax_mapper', 'machinery.create',           true),
  ('municipal_tax_mapper', 'machinery.edit',             true),
  ('municipal_tax_mapper', 'machinery.delete',           false),
  ('municipal_tax_mapper', 'accounting.view',            false),
  ('municipal_tax_mapper', 'user_management.view',       false),
  ('municipal_tax_mapper', 'user_management.create',     false),
  ('municipal_tax_mapper', 'user_management.edit',       false),
  ('municipal_tax_mapper', 'user_management.delete',     false),
  ('municipal_tax_mapper', 'role_management.view',       false),
  ('municipal_tax_mapper', 'role_management.edit',       false),
  ('municipal_tax_mapper', 'dashboard.view',             true),

  -- accountant
  ('accountant', 'building_structures.view',   false),
  ('accountant', 'building_structures.create', false),
  ('accountant', 'building_structures.edit',   false),
  ('accountant', 'building_structures.delete', false),
  ('accountant', 'land_improvements.view',     false),
  ('accountant', 'land_improvements.create',   false),
  ('accountant', 'land_improvements.edit',     false),
  ('accountant', 'land_improvements.delete',   false),
  ('accountant', 'machinery.view',             false),
  ('accountant', 'machinery.create',           false),
  ('accountant', 'machinery.edit',             false),
  ('accountant', 'machinery.delete',           false),
  ('accountant', 'accounting.view',            true),
  ('accountant', 'user_management.view',       false),
  ('accountant', 'user_management.create',     false),
  ('accountant', 'user_management.edit',       false),
  ('accountant', 'user_management.delete',     false),
  ('accountant', 'role_management.view',       false),
  ('accountant', 'role_management.edit',       false),
  ('accountant', 'dashboard.view',             true),

  -- user (basic)
  ('user', 'building_structures.view',   false),
  ('user', 'building_structures.create', false),
  ('user', 'building_structures.edit',   false),
  ('user', 'building_structures.delete', false),
  ('user', 'land_improvements.view',     false),
  ('user', 'land_improvements.create',   false),
  ('user', 'land_improvements.edit',     false),
  ('user', 'land_improvements.delete',   false),
  ('user', 'machinery.view',             false),
  ('user', 'machinery.create',           false),
  ('user', 'machinery.edit',             false),
  ('user', 'machinery.delete',           false),
  ('user', 'accounting.view',            false),
  ('user', 'user_management.view',       false),
  ('user', 'user_management.create',     false),
  ('user', 'user_management.edit',       false),
  ('user', 'user_management.delete',     false),
  ('user', 'role_management.view',       false),
  ('user', 'role_management.edit',       false),
  ('user', 'dashboard.view',             true)
ON CONFLICT (role, feature) DO NOTHING;

-- ── Grants ────────────────────────────────────────────────────────────────────
-- Required so Supabase roles can access the table.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON TABLE role_permissions TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON TABLE role_permissions TO authenticated, service_role;

-- ── Row Level Security ────────────────────────────────────────────────────────
-- RLS is intentionally disabled: all access goes through API routes that
-- enforce super_admin authorization at the application level.
-- The service role (used by the API) bypasses RLS regardless, but disabling
-- it avoids any edge-case policy conflicts with auth.uid() being null.
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
