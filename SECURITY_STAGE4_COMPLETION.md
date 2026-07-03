# Stage 4 Completion - Cross-Municipality API Authorization

Date completed: 2026-07-03 Asia/Manila

Stage 4 covered:
- Finding 10: building/land single-record GET/PUT missing ownership/municipality checks.
- Finding 11: duplicate building `PUT ?id=` bypassed workflow checks.
- Finding 12: review transitions were not scoped to the record's municipality/assignment.
- Finding 13: assign endpoints allowed cross-municipality reassignment.
- Finding 14: review queue leaked cross-municipality data for municipal roles.
- Finding 15: photo upload could replace another record's documents.
- Finding 16: submit endpoint could submit or claim another user's draft.
- Finding 17: comments were visible/postable across municipalities.

## Implemented

Shared authorization:
- Updated `lib/faas/access-control.ts` with shared FAAS scope helpers.
- Province-wide access is limited to admin/super-admin and provincial assessor roles.
- LAOO access is now municipality/assignment scoped instead of automatically province-wide.
- Added reusable positive-integer ID validation and shared FAAS access select strings.

Building and land single-record routes:
- Added scope checks to building GET/PUT.
- Added scope checks to land GET/PUT.
- Generic PUT routes now strip workflow fields such as reviewer IDs, `submitted_at`, and `approved_at`.
- Generic PUT routes no longer accept arbitrary workflow status changes beyond draft/returned editing.

Duplicate building PUT route:
- Disabled `PUT /api/faas/building-structures?id=...` with a `410` response.
- Updates must use `/api/faas/building-structures/[id]`, which now applies scope checks.

Review transitions:
- Added record-scope checks to building review actions.
- Added record-scope checks to land review actions.
- Municipal and LAOO users can no longer act on records outside their allowed municipality/assignment.

Assignment:
- Added record-scope checks to building assign.
- Added record-scope checks to land assign.
- Assignment targets must be valid municipal form roles and must match the record municipality unless the actor is admin/province-wide.

Submit:
- Added record-scope checks to building submit.
- Added record-scope checks to land submit.
- Users can no longer submit or claim authorship on records outside their allowed scope.

Comments:
- Added parent-record scope checks before reading building comments.
- Added parent-record scope checks before posting/deleting building comments.
- Added parent-record scope checks before reading land comments.
- Added parent-record scope checks before posting/deleting land comments.

Review queue:
- Municipal tax mapper and municipal assessor review queues are now municipality-scoped.
- LAOO remains municipality-scoped.

Photos:
- Photo uploads now validate parent ID as a positive integer before using it in storage paths.
- Photo uploads now verify access to the parent FAAS record before upload, replacement, or signed URL work.

## Verification

Static/build checks:
- `npx tsc --noEmit` passed.
- `npm run build` passed.

Notes:
- No new DB migration was needed for Stage 4; this stage hardened server-side API authorization.
- Cross-tenant behavioral tests need real test users from different municipalities. The code now has the authorization gates needed for that test pass.

## Still Pending

These were not part of Stage 4 and remain for later stages:
- Comment `author_role` database verification.
- Server-side MIME signature/magic-byte validation.
- Draft localStorage namespacing and logout cleanup.
- Service proxy `getSession()` to `getUser()` hardening.
- Migration cleanup and archival of historical root SQL fix files.
