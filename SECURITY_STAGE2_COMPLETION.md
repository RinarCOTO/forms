# Stage 2 Completion - Privilege Escalation Hardening

Date completed: 2026-07-03 Asia/Manila

Stage 2 covered:
- Finding 4: users could update their own `role` / `is_active`.
- Finding 5: `role_permissions` was writable by non-service roles.

## Implemented

API changes:
- Updated `app/api/auth/signup/route.ts` so the manual profile fallback uses the server-side service-role client.
- Updated `app/api/auth/user/route.ts` so current-user profile updates go through the server-side service-role client with an allow-list of safe fields.

Database changes:
- Added and applied `database/20260703_stage2_privilege_escalation_hardening.sql`.
- Removed broad `anon` and `authenticated` grants on `users`.
- Kept authenticated direct `SELECT` on `users`, limited by RLS to the caller's own profile.
- Removed direct authenticated `UPDATE` on `users`.
- Dropped the old `Users can update own profile` RLS policy.
- Dropped recursive super-admin `users` policies because admin user management is handled through service-role API routes.
- Removed all direct `anon` and `authenticated` grants on `role_permissions`.
- Added an explicit `TO service_role` management policy for `role_permissions`.

## Verification

Static/build checks:
- `npx tsc --noEmit` passed.
- `npm run build` passed.

Live privilege checks:

| Role | Table | Privilege | Result |
| --- | --- | --- | --- |
| `authenticated` | `public.users` | `UPDATE` | `false` |
| `authenticated` | `public.users` | `SELECT` | `true` |
| `anon` | `public.users` | `SELECT` | `false` |
| `authenticated` | `public.role_permissions` | `UPDATE` | `false` |
| `authenticated` | `public.role_permissions` | `INSERT` | `false` |
| `authenticated` | `public.role_permissions` | `DELETE` | `false` |
| `anon` | `public.role_permissions` | `SELECT` | `false` |

Direct Supabase anon REST checks:

| Request | Result |
| --- | --- |
| `users?select=id&limit=1` with anon key | `401 permission denied for table users` |
| `role_permissions?select=role&limit=1` with anon key | `401 permission denied for table role_permissions` |
| `PATCH role_permissions?...` with anon key | `401 permission denied for table role_permissions` |

Live metadata:
- `role_permissions` now only shows `service_role` table grants.
- `role_permissions` has `Service role manages role permissions` with roles `{service_role}`.
- `users` no longer shows direct `anon` grants.
- `users` no longer shows authenticated `UPDATE` grants.
- `users` policies now include own-profile read and own-profile insert only.

## Still Pending

These were not part of Stage 2 and remain for later stages:
- FAAS table write grants and RLS policy coverage for `building_structures`, `land_improvements`, and `form_locks`.
- Cross-municipality IDORs in building/land GET/PUT, assign, review, submit, comments, and upload flows.
- File MIME sniffing, draft localStorage hygiene, comment author-role verification, and service proxy hardening.
- Migration cleanup and archival of historical root SQL fix files.
