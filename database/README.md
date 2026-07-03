# Database Migration Notes

Canonical security migrations are the dated files under `database/`.

For the 2026-07-03 security audit rollout, apply these in order:

1. `20260703_stage1_faas_rls_hardening.sql`
2. `20260703_stage2_privilege_escalation_hardening.sql`
3. `20260703_stage3_core_rls_hardening.sql`
4. `20260703_stage5_comment_author_role_hardening.sql`
5. `20260703_stage6_laoo_rls_alignment.sql`

`database/20260703_security_policy_verification.sql` is a read-only verification script. It is not a migration.

## Historical SQL

The repository root still contains older ad hoc SQL setup/fix files. Treat these as historical reference, not files to apply to a live database after the dated migrations above:

- `CREATE_COMPLETE_DATABASE.sql`
- `ADD_MUNICIPALITY.sql`
- `QUICK_FIX_LAND_IMPROVEMENTS.sql`
- `FIX_SUPABASE_PERMISSIONS.sql`
- `FIX_LAND_IMPROVEMENTS_PERMISSIONS.sql`
- `COMPLETE_USER_FIX.sql`
- `FIX_RLS_POLICIES.sql`
- `VERIFY_MIGRATION.sql`
- other root-level setup/fix SQL files

Several of those files intentionally preserve old setup paths or emergency fixes that the security stages now supersede. Keep this note with deployment handoffs so future reviewers know the dated migrations are the current source of truth.
