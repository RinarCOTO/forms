-- Read-only verification script for the 2026-07-03 RPFAAS security rollout.
-- Run after applying the Stage 1, 2, 3, 5, and 6 security migrations.

-- 1. RLS should be enabled on all audited tables.
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'building_structures',
    'land_improvements',
    'machinery',
    'users',
    'role_permissions',
    'form_locks',
    'form_comments',
    'tax_declarations',
    'form_review_history'
  )
ORDER BY c.relname;

-- 2. Anonymous users should not have direct grants on sensitive tables.
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'anon'
  AND table_name IN (
    'building_structures',
    'land_improvements',
    'machinery',
    'users',
    'role_permissions',
    'form_locks',
    'form_comments',
    'tax_declarations',
    'form_review_history'
  )
ORDER BY table_name, privilege_type;

-- 3. Authenticated clients should not have direct write grants on protected tables.
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'authenticated'
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER')
  AND table_name IN (
    'building_structures',
    'land_improvements',
    'machinery',
    'users',
    'role_permissions',
    'form_locks'
  )
ORDER BY table_name, privilege_type;

-- 4. Service-role-only policies should be explicit to service_role.
SELECT tablename, policyname, roles::text AS roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('role_permissions', 'form_locks', 'tax_declarations', 'form_review_history')
ORDER BY tablename, policyname;

-- 5. FAAS SELECT policies should not give LAOO province-wide access.
SELECT tablename, policyname, roles::text AS roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('building_structures', 'land_improvements', 'machinery')
  AND policyname = 'Authenticated scoped select on ' || tablename
ORDER BY tablename;

-- 6. Comment author_role hardening should be present.
SELECT tgname AS trigger_name
FROM pg_trigger
WHERE tgrelid = 'public.form_comments'::regclass
  AND tgname = 'trg_form_comments_author_role_from_profile'
  AND NOT tgisinternal;

SELECT conname, pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE conrelid = 'public.form_comments'::regclass
  AND conname = 'form_comments_author_role_check';
