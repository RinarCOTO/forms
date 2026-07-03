# RPFAAS Security Audit Staging Tasks

Source: Internal Security Review - Defensive Audit, RPFAAS whole-application security audit.

Goal: stage the security updates so the highest-risk access-control and data-exposure issues are fixed first, with each stage small enough to review and test safely.

Note: the audit header says 24 findings, but the pasted audit text lists findings 1-23. Treat this task list as covering the pasted findings 1-23.

## Stage 0 - Confirm Current Production State

Status: completed. See `SECURITY_STAGE0_LIVE_SNAPSHOT.md`.

Purpose: verify which database policies and grants are actually live before applying migrations.

Tasks:
- Query `pg_policies` for `building_structures`, `land_improvements`, `machinery`, `users`, `role_permissions`, `form_locks`, `form_comments`, `tax_declarations`, and `form_review_history`.
- Query table grants for `anon`, `authenticated`, and `service_role`.
- Confirm whether root SQL fix files were already applied manually in Supabase.
- Save the before/after policy output with the migration PR or deployment notes.

Acceptance checks:
- We know exactly which permissive policies and grants are active.
- No migration is applied blindly over an unknown database state.

## Stage 1 - Block Zero-Login Data Access

Status: completed. See `SECURITY_STAGE1_COMPLETION.md`.

Priority: critical.

Findings covered:
- Finding 1: unauthenticated machinery record GET/PUT.
- Finding 2: unauthenticated photo listing and signed URL minting.
- Finding 3: municipality-scoping policy typo left old permissive RLS policies alive.

Likely files:
- `app/api/faas/machinery/[id]/route.ts`
- `lib/faas/photo-route-handlers.ts`
- `CREATE_COMPLETE_DATABASE.sql`
- `ADD_MUNICIPALITY.sql`
- new ordered migration under `database/`

Tasks:
- Add auth and role/municipality checks to machinery GET and PUT, matching the sibling DELETE or print-route pattern.
- Add auth to shared photo GET handling before any service-role query or signed URL generation.
- Verify the caller can access the parent FAAS record before returning photo metadata or signed URLs.
- Drop the exact old policy names from `CREATE_COMPLETE_DATABASE.sql`, including `"Users can view all building structures"` and corresponding land/machinery policies.
- Replace them with scoped SELECT policies and confirm no permissive legacy policy remains.

Acceptance checks:
- Anonymous `GET/PUT /api/faas/machinery/:id` returns 401.
- Anonymous `/api/faas/*/photos?...` returns 401 and never returns signed URLs.
- Authenticated users cannot read other municipalities through direct PostgREST calls.
- `pg_policies` shows only the intended scoped policies for the three FAAS tables.

## Stage 2 - Remove Direct Privilege Escalation Paths

Status: completed. See `SECURITY_STAGE2_COMPLETION.md`.

Priority: critical/high.

Findings covered:
- Finding 4: users can update their own `role` / `is_active`.
- Finding 5: `role_permissions` writable by authenticated users with RLS disabled.

Likely files:
- `FIX_RLS_POLICIES.sql`
- `COMPLETE_USER_FIX.sql`
- `database/role_permissions_migration.sql`
- new ordered migration under `database/`

Tasks:
- Revoke authenticated UPDATE rights on protected `users` columns such as `role` and `is_active`.
- Keep role changes behind the existing super-admin API path or a secured RPC.
- Re-enable RLS on `role_permissions`.
- Restrict `role_permissions` writes to `service_role` only.
- Confirm app-layer permission editing still works through the server-side admin route.

Acceptance checks:
- A normal user cannot PATCH their own role through PostgREST.
- A normal user cannot INSERT/UPDATE/DELETE `role_permissions` through PostgREST.
- Super-admin role/permission management still works through the app.

## Stage 3 - Restore Real RLS On Core Tables

Status: completed. See `SECURITY_STAGE3_COMPLETION.md`.

Priority: high.

Findings covered:
- Finding 6: `land_improvements` RLS disabled plus anon SELECT grant.
- Finding 7: `building_structures` RLS disabled plus anon/authenticated broad grants.
- Finding 8: permissive `USING (true)` land-improvements policies.
- Finding 9: `form_locks` has no RLS.
- Finding 22: service-role policies missing explicit `TO service_role`.

Likely files:
- `QUICK_FIX_LAND_IMPROVEMENTS.sql`
- `FIX_SUPABASE_PERMISSIONS.sql`
- `FIX_LAND_IMPROVEMENTS_PERMISSIONS.sql`
- `database/form_locks_migration.sql`
- `database/20260225_review_workflow_migration.sql`
- new ordered migration under `database/`

Tasks:
- Re-enable RLS on `land_improvements` and `building_structures`.
- Remove anon SELECT grants from sensitive FAAS tables.
- Replace all `USING (true)` FAAS policies with scoped ownership/municipality policies.
- Enable RLS on `form_locks`.
- Restrict lock INSERT/UPDATE/DELETE to `locked_by = auth.uid()`, with a service-role cleanup path.
- Add explicit `TO service_role` to service-only policies for `tax_declarations` and `form_review_history`.

Acceptance checks:
- Anonymous PostgREST reads of FAAS tables fail.
- Authenticated users can only access records within their allowed scope.
- Users cannot delete or overwrite other users' active locks.
- Service-role maintenance still works.

## Stage 4 - Fix Authenticated Cross-Municipality IDORs

Priority: high/medium.

Findings covered:
- Finding 10: building/land single-record GET/PUT missing municipality or ownership checks.
- Finding 11: duplicate `?id=` building PUT bypasses status lock and allow-list.
- Finding 12: review transitions not scoped to municipality.
- Finding 13: assign endpoints allow cross-municipality reassignment.
- Finding 14: review queue leaks cross-municipality data for municipal roles.
- Finding 15: photo upload can overwrite another record's documents.
- Finding 16: submit endpoint can hijack another user's draft.
- Finding 17: comments visible/postable across municipalities.

Likely files:
- `app/api/faas/building-structures/[id]/route.ts`
- `app/api/faas/land-improvements/[id]/route.ts`
- `app/api/faas/building-structures/route.ts`
- `app/api/faas/building-structures/[id]/review/route.ts`
- `app/api/faas/land-improvements/[id]/review/route.ts`
- `app/api/faas/building-structures/[id]/assign/route.ts`
- `app/api/faas/land-improvements/[id]/assign/route.ts`
- `app/api/review/route.ts`
- `lib/faas/photo-route-handlers.ts`
- `app/api/faas/building-structures/[id]/submit/route.ts`
- `app/api/faas/land-improvements/[id]/submit/route.ts`
- `app/api/faas/building-structures/[id]/comments/route.ts`
- `app/api/faas/land-improvements/[id]/comments/route.ts`

Tasks:
- Extract or reuse one shared authorization helper for FAAS record access, so GET/PUT/submit/review/assign/comments/photo endpoints enforce the same municipality/ownership rules.
- Port the known-good DELETE and print-route checks into GET and PUT handlers.
- Remove the duplicate building `PUT ?id=` route or make it match the path-param PUT behavior.
- Require municipality match or provincial/admin role before review transitions.
- Require target record and assigned user to belong to the allowed municipality for assignment.
- Apply municipality scoping to municipal tax mapper and municipal assessor review queues.
- Verify parent-record authorization before photo upload, replacement, comment read/write, and submit.

Acceptance checks:
- A municipal user cannot read, edit, submit, assign, approve, return, comment on, or replace photos for another municipality's record.
- Approved-record locks and workflow transition rules still work.
- Admin/provincial exceptions are explicit and tested.

## Stage 5 - File, Comment, Session, And Draft Hardening

Priority: medium/low.

Findings covered:
- Finding 18: `form_comments.author_role` is client-supplied and unverified.
- Finding 19: uploaded file MIME type is trusted without checking bytes.
- Finding 20: draft PII remains in un-namespaced localStorage after logout.
- Finding 21: internal service proxy uses `getSession()` and forwards cookies even without a valid user.
- Finding 23: parent ID used in storage path before clean integer validation.

Likely files:
- `database/20260225_review_workflow_migration.sql`
- `lib/faas/photo-route-handlers.ts`
- `utils/form-draft-storage.ts`
- `lib/auth.ts`
- `app/api/auth/logout/route.ts`
- `app/api/services/[service]/[...path]/route.ts`

Tasks:
- Stop accepting client-supplied `author_role`; derive it from the authenticated user server-side.
- Add server-side file signature validation before upload.
- Validate parent IDs as clean positive integers before using them in storage paths or queries.
- Namespace draft localStorage keys by authenticated user ID.
- Clear FAAS draft keys on logout.
- Replace proxy `getSession()` trust with `getUser()` validation and return 401 before proxying unauthenticated requests.

Acceptance checks:
- Comment author role always matches the caller's actual role.
- Spoofed file types are rejected.
- Malformed parent IDs are rejected before storage paths are built.
- Logging out clears sensitive local draft data for shared-workstation use.
- Service proxy does not forward unauthenticated requests or raw cookies without a validated user.

## Stage 6 - Migration Hygiene And Regression Coverage

Priority: process fix.

Tasks:
- Move ad hoc root SQL files into an ordered `database/` migration sequence or archive them after superseding.
- Add comments in migrations naming the exact old policy names being dropped.
- Add a lightweight policy verification SQL script that can be run after deployment.
- Add route-level regression tests or scripted checks for:
  - anonymous machinery access blocked;
  - anonymous photo URL access blocked;
  - cross-municipality GET/PUT blocked;
  - cross-municipality review/assign/submit/comment/photo actions blocked;
  - direct PostgREST role escalation blocked.

Acceptance checks:
- Future reviewers can tell which SQL files are historical and which are safe to apply.
- Policy verification is repeatable.
- The fixed issues have direct regression coverage.

## Suggested Implementation Order

1. Stage 0: verify live policies and grants.
2. Stage 1: fix anonymous machinery/photo/RLS policy issues.
3. Stage 2: close privilege escalation through `users` and `role_permissions`.
4. Stage 3: restore real RLS on FAAS and lock tables.
5. Stage 4: close cross-municipality API gaps.
6. Stage 5: harden file validation, comments, drafts, and service proxy.
7. Stage 6: clean migrations and add regression checks.

## Rollout Notes

- Deploy API authorization fixes and database RLS migrations together when they depend on each other.
- Test with at least three accounts: anonymous, municipal-level user, and super admin/provincial admin.
- Prefer small PRs by stage, but do not split a stage in a way that leaves production more permissive than before.
- Keep before/after `pg_policies` and grant outputs with the deployment record.
