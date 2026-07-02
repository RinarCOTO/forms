# Stage 1 Completion - Zero-Login FAAS Access

Date completed: 2026-07-03 Asia/Manila

Stage 1 covered:
- Finding 1: unauthenticated machinery GET/PUT.
- Finding 2: unauthenticated photo listing and signed URL minting.
- Finding 3: FAAS RLS policy/grant cleanup for zero-login reads.

## Implemented

API changes:
- Added shared FAAS access helpers in `lib/faas/access-control.ts`.
- Added authentication and scoped access checks to `app/api/faas/machinery/[id]/route.ts` GET and PUT.
- Added clean positive-integer ID validation to machinery GET/PUT.
- Added parent-record authorization to shared photo GET handling in `lib/faas/photo-route-handlers.ts`.
- Added parent table/access-select config to building, land, and machinery photo routes.

Database changes:
- Added `database/20260703_stage1_faas_rls_hardening.sql`.
- Applied the migration to the live Supabase/Postgres database.
- Removed `anon SELECT` from `land_improvements`.
- Enabled RLS on `machinery`.
- Replaced the three FAAS SELECT policies with authenticated scoped policies:
  - `Authenticated scoped select on building_structures`
  - `Authenticated scoped select on land_improvements`
  - `Authenticated scoped select on machinery`

## Verification

Static/build checks:
- `npx tsc --noEmit` passed.
- `npm run build` passed.

Live database metadata:
- `machinery` RLS is now enabled.
- `land_improvements` no longer shows an `anon SELECT` grant.
- FAAS SELECT policies are now scoped to `{authenticated}`, not `{public}`.

Direct Supabase anon REST checks:

| Request | Result |
| --- | --- |
| `land_improvements?select=id&limit=1` with anon key | `401 permission denied for table land_improvements` |
| `building_structures?select=id&limit=1` with anon key | `401 permission denied for table building_structures` |
| `machinery?select=id&limit=1` with anon key | `401 permission denied for table machinery` |

Local unauthenticated route checks:

| Request | Result |
| --- | --- |
| `GET /api/faas/machinery/1` | `401 Unauthorized` |
| `GET /api/faas/land-improvements/photos?landImprovementId=1` | `401 Unauthorized` |
| `GET /api/faas/building-structures/photos?buildingStructureId=1` | `401 Unauthorized` |
| `GET /api/faas/machinery/photos?machineryId=1` | `401 Unauthorized` |

## Still Pending

These were not part of Stage 1 and remain for later stages:
- `users` broad grants and own-profile role/status update risk.
- `role_permissions` broad grants.
- `form_locks` authenticated CRUD grants and lock policy review.
- Cross-municipality IDORs in building/land GET/PUT, assign, review, submit, comments, and upload flows.
- File MIME sniffing, draft localStorage hygiene, comment author-role verification, and service proxy hardening.

## Notes

- The local dev server was stopped after route verification.
- Stage 1 deliberately did not delete or archive historical root SQL files yet; migration cleanup is Stage 6.
