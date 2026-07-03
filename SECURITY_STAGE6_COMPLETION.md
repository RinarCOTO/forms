# Stage 6 Completion - Migration Hygiene And Regression Coverage

Date completed: 2026-07-03 Asia/Manila

Stage 6 covered:
- Migration cleanup and historical SQL guidance.
- Repeatable policy verification.
- Scripted route regression checks.
- Final RLS alignment discovered during closeout.

## Implemented

Migration hygiene:
- Added `database/README.md` to identify the dated migrations as the canonical security rollout path.
- Marked root-level ad hoc SQL files as historical reference, not post-hardening deployment files.
- Added `database/20260703_security_policy_verification.sql` as a read-only SQL verification script.

Final RLS alignment:
- Added `database/20260703_stage6_laoo_rls_alignment.sql`.
- The live FAAS SELECT policies now align with the Stage 4 API authorization model.
- LAOO users are no longer province-wide in direct RLS/PostgREST reads.

Verification tooling:
- Added `scripts/security-verify-policies.js`.
- Added `scripts/security-regression-checks.js`.
- Added package scripts:
  - `npm run security:verify-policies`
  - `npm run security:regression`

## Verification

Static/build checks:
- `node --check scripts/security-verify-policies.js` passed.
- `node --check scripts/security-regression-checks.js` passed.
- `npx tsc --noEmit` passed.
- `npm run build` passed.

Live database checks:
- Stage 6 LAOO RLS alignment migration applied successfully.
- `npm run security:verify-policies` passed against the live Supabase database.
- The verifier confirmed:
  - RLS is enabled on audited tables.
  - No anon grants remain on audited tables.
  - No direct role/is_active mutation grants remain.
  - No direct anon/authenticated writes remain on `users`, `role_permissions`, or `form_locks`.
  - Service-only policies are explicit to `service_role`.
  - FAAS SELECT policies do not grant LAOO province-wide access.
  - The `form_comments` author-role trigger and constraint are present.

HTTP regression checks:
- Started local Next dev server.
- `npm run security:regression` passed safe checks:
  - anonymous machinery GET blocked with 401.
  - anonymous machinery PUT blocked with 401.
  - anonymous building photo listing blocked with 401.
  - anonymous land photo listing blocked with 401.
  - anonymous machinery photo listing blocked with 401.
- Cross-municipality checks were intentionally skipped because they require real test tokens and record IDs.
- Local dev server was stopped after verification.

## Remaining Manual QA

Run the cross-municipality regression checks with test-only accounts and disposable records:

```bash
SECURITY_TEST_CROSS_TOKEN="municipal-user-jwt" \
SECURITY_TEST_OTHER_BUILDING_ID="123" \
SECURITY_TEST_OTHER_LAND_ID="456" \
npm run security:regression
```

For mutating paths such as PUT, assign, submit, and review, use disposable records and add:

```bash
SECURITY_TEST_ALLOW_MUTATION_CHECKS=1
```

## Final Status

Stages 0 through 6 are complete. The remaining work is manual cross-tenant QA with real test accounts, not another implementation stage.
