# Stage 0 Live Security Snapshot

Date checked: 2026-07-03 Asia/Manila

Source:
- Live Supabase/Postgres metadata queried with `scripts/security-stage0-snapshot.js`.
- Static SQL scan across repo migration/fix files.

This snapshot includes policy and grant metadata only. No credentials or table row data were printed.

## Executive Summary

Stage 0 is complete enough to begin Stage 1 planning.

Confirmed live risks:
- `machinery` has RLS disabled.
- `land_improvements` grants `SELECT` to `anon`.
- `land_improvements` grants authenticated users direct `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- `users` grants `anon` and `authenticated` broad table and column privileges, including `role` and `is_active`.
- `users` has an own-profile UPDATE policy, so the role self-update risk remains live for authenticated users.
- `role_permissions` grants `anon` and `authenticated` broad table privileges.
- `form_comments` allows any authenticated user to read comments and insert comments as long as `author_id = auth.uid()`, with no FAAS record scope.
- `tax_declarations` and `form_review_history` have service-role-style `USING (true)` policies exposed as `{public}` policies instead of explicit `TO service_role`.

Live state differs from the pasted audit in a few places:
- The old `"Users can view all building structures"`, `"Users can view all land improvements"`, and `"Users can view all machinery"` policies were not present in the live policy snapshot.
- `building_structures` RLS is enabled live and no `anon` grant was shown for it.
- `land_improvements` RLS is enabled live, but the `anon SELECT` grant plus the current public SELECT policy still makes anonymous access a concern.
- `role_permissions` RLS is enabled live, but dangerous broad grants remain.
- `form_locks` RLS is enabled live, but no policies were shown for it; authenticated CRUD grants remain present.

## Live RLS Status

| Table | RLS enabled | Notes |
| --- | --- | --- |
| `building_structures` | yes | Scoped SELECT policy exists. |
| `land_improvements` | yes | Scoped SELECT policy exists, but `anon SELECT` grant remains. |
| `machinery` | no | Scoped SELECT policy exists but is inert while RLS is disabled. |
| `users` | yes | Own-profile update policy remains. |
| `role_permissions` | yes | No policies appeared in the snapshot; broad grants remain. |
| `form_locks` | yes | No policies appeared in the snapshot; authenticated CRUD grants remain. |
| `form_comments` | yes | Authenticated read/insert/update policies are not FAAS-record scoped. |
| `tax_declarations` | yes | Service-role-style public `USING (true)` policy exists. |
| `form_review_history` | yes | Service-role-style public `USING (true)` policy exists. |

## Live Grants To Fix

| Table | Live grant concern |
| --- | --- |
| `land_improvements` | `anon SELECT`; authenticated `SELECT`, `INSERT`, `UPDATE`, `DELETE`. |
| `users` | `anon` and `authenticated` have broad table privileges, including `UPDATE` on `role` and `is_active`. |
| `role_permissions` | `anon` and `authenticated` have broad privileges including `INSERT`, `UPDATE`, and `DELETE`. |
| `form_locks` | authenticated has `SELECT`, `INSERT`, `UPDATE`, and `DELETE`. |
| `building_structures` | authenticated has broad table privileges; RLS currently carries the real restriction. |
| `form_comments` | authenticated has `SELECT`, `INSERT`, and `UPDATE`. |

## Live Policies To Review

### FAAS municipality-scoped SELECT policies

Live policies exist for:
- `building_structures`
- `land_improvements`
- `machinery`

Concern:
- The policy expression includes a branch equivalent to "allow when no matching user with a non-null municipality exists."
- Combined with `land_improvements` `anon SELECT`, this can allow anonymous reads because `auth.uid()` is null and no matching user row exists.
- For `machinery`, the policy is not active while RLS is disabled.

### `users`

Live policies:
- Super admins can view all profiles.
- Super admins can update all profiles.
- Users can view own profile.
- Users can insert own profile.
- Users can update own profile.

Concern:
- Because `authenticated` has UPDATE privileges on every `users` column, the own-profile update policy can still permit role/status self-modification unless fixed with column revokes or a stricter policy/RPC.

### `form_comments`

Live policies:
- Authenticated users can read form comments.
- Authors can insert form comments.
- Authors can update own form comments.

Concern:
- These policies are user-authenticated, but not scoped to the FAAS record's municipality, owner, or assignment.
- `author_role` is still a separate Stage 5 concern.

### Service-role-style policies

Live policies:
- `form_review_history`: `Service role manages review history`, roles `{public}`, command `ALL`, `USING true`, `WITH CHECK true`.
- `tax_declarations`: `Service role manages tax declarations`, roles `{public}`, command `ALL`, `USING true`, `WITH CHECK true`.

Concern:
- They should be explicit `TO service_role` policies so future grants cannot widen access accidentally.

## Static Repo Evidence

The repo still contains SQL files that can recreate or explain several audit findings:

| File | Evidence |
| --- | --- |
| `CREATE_COMPLETE_DATABASE.sql` | Creates `"Users can view all building structures"`, `"Users can view all land improvements"`, and `"Users can view all machinery"`. |
| `ADD_MUNICIPALITY.sql` | Drops typoed policy names without `"all"`, so the original permissive policies would survive if this was applied over the original setup. |
| `QUICK_FIX_LAND_IMPROVEMENTS.sql` | Disables RLS on `land_improvements` and grants `anon SELECT`. |
| `FIX_SUPABASE_PERMISSIONS.sql` | Disables RLS on `building_structures` and grants broad access. |
| `FIX_LAND_IMPROVEMENTS_PERMISSIONS.sql` | Creates permissive `USING (true)` policies. |
| `COMPLETE_USER_FIX.sql` | Grants all on `users` to `authenticated` and `anon`, and disables RLS in that file. |
| `database/role_permissions_migration.sql` | Grants broad `role_permissions` writes and disables RLS in that file. |
| `database/form_locks_migration.sql` | Grants authenticated CRUD on `form_locks`. |

These files should be treated as historical/ad hoc fixes unless replaced by ordered migrations.

## Stage 0 Acceptance Status

| Check | Status |
| --- | --- |
| Query `pg_policies` for target tables | Done |
| Query RLS enabled/forced state | Done |
| Query table grants for `anon`, `authenticated`, and `service_role` | Done |
| Query `users` column grants | Done |
| Confirm root SQL fix files that could explain audit state | Done by static scan |
| Save Stage 0 evidence | Done in this file |

## Recommended Next Step

Start Stage 1 with two tracks:

1. API fixes:
   - Add auth/scope checks to `app/api/faas/machinery/[id]/route.ts`.
   - Add auth/scope checks to shared photo listing in `lib/faas/photo-route-handlers.ts`.

2. Database migration:
   - Enable RLS on `machinery`.
   - Remove `anon SELECT` from `land_improvements`.
   - Tighten the FAAS SELECT policy so anonymous users and users without a municipality do not get broad access by default.
   - Drop or supersede historical permissive policies/files with exact policy names documented.
