-- Stage 2 security hardening for privilege escalation paths.
--
-- Purpose:
-- - Stop users from changing their own role/is_active through direct PostgREST.
-- - Stop anon/authenticated users from changing role_permissions directly.
-- - Keep application admin flows working through the server-side service role.

BEGIN;

-- ── users ───────────────────────────────────────────────────────────────────
-- Remove broad grants left by historical fix scripts.
REVOKE ALL PRIVILEGES ON TABLE public.users FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.users FROM authenticated;

-- Direct clients may read only what RLS allows. Server-side admin routes still
-- use service_role and bypass RLS for administrative user management.
GRANT SELECT ON TABLE public.users TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.users TO service_role;

-- The old own-profile UPDATE policy was row-scoped but not column-scoped.
-- Profile updates now go through /api/auth/user, which allow-lists safe fields.
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.users;

-- Keep own-profile read/create policies in place for compatibility.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ── role_permissions ────────────────────────────────────────────────────────
-- Permissions are read/managed through server-side APIs. Direct PostgREST
-- writes would let a normal user grant their role admin features.
REVOKE ALL PRIVILEGES ON TABLE public.role_permissions FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.role_permissions FROM authenticated;
GRANT ALL PRIVILEGES ON TABLE public.role_permissions TO service_role;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages role permissions" ON public.role_permissions;
CREATE POLICY "Service role manages role permissions"
  ON public.role_permissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
