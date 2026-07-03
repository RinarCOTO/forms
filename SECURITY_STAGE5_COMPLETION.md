# Stage 5 Completion - File, Comment, Session, And Draft Hardening

Date completed: 2026-07-03 Asia/Manila

Stage 5 covered:
- Finding 18: `form_comments.author_role` was client-supplied and unverified.
- Finding 19: uploaded file MIME type was trusted without checking file bytes.
- Finding 20: draft PII could remain in localStorage after logout or user changes.
- Finding 21: internal service proxy used `getSession()` before validating the user.
- Finding 23: parent ID could be used in storage paths before clean integer validation.

## Implemented

Comment author role:
- Added `database/20260703_stage5_comment_author_role_hardening.sql`.
- The live database now has `trg_form_comments_author_role_from_profile` on `form_comments`.
- Inserts and updates force `author_role` to match `public.users.role` for `author_id`.
- The `form_comments_author_role_check` constraint now includes provincial assessor roles used by the app.

Upload validation:
- Photo uploads now validate file signatures/magic bytes for JPEG, PNG, WebP, and PDF.
- Storage extensions are derived from the validated MIME type instead of the original filename.
- Existing parent-record ID validation remains in place before storage paths are built.

Service proxy:
- `app/api/services/[service]/[...path]/route.ts` now calls `getUser()` first.
- Proxy requests return 401 before forwarding Authorization headers or cookies when the user is not valid.
- Print-service cookie forwarding now only happens after user validation.

Draft cleanup:
- Added FAAS draft cleanup helpers in `utils/form-draft-storage.ts`.
- Login binds draft storage to the authenticated user ID and clears stale FAAS drafts when a different user signs in.
- Logout clears FAAS draft keys from localStorage before returning to the login screen.
- Legacy `lib/auth.logout()` also clears FAAS draft keys.

## Verification

Static/build checks:
- `npx tsc --noEmit` passed.
- `npm run build` passed.

Live database checks:
- Stage 5 migration applied successfully.
- Trigger readback returned `trigger_rows 1`.
- Constraint readback returned `constraint_rows 1`.

## Notes

- Draft storage was hardened with user-bound cleanup instead of a broad key rename across every form step. This closes the shared-workstation leak while avoiding a fragile rewrite of the older direct localStorage calls.

## Still Pending

These remain for Stage 6:
- Migration cleanup and archival of historical root SQL fix files.
- Repeatable policy verification scripts.
- Route-level regression tests for the fixed anonymous, privilege-escalation, and cross-municipality paths.
