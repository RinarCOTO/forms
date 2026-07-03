# Stage 3 Completion - Core RLS And Grants

Date completed: 2026-07-03 Asia/Manila

Stage 3 covered:
- Finding 6: `land_improvements` anonymous/direct grant cleanup continued from Stage 1.
- Finding 7: `building_structures` direct broad grants.
- Finding 8: permissive FAAS policy cleanup continued from Stage 1.
- Finding 9: `form_locks` direct authenticated access.
- Finding 22: service-role policies missing explicit `TO service_role`.

## Implemented

Database changes:
- Added and applied `database/20260703_stage3_core_rls_hardening.sql`.
- Removed direct authenticated `INSERT`, `UPDATE`, and `DELETE` access from `building_structures`.
- Removed direct authenticated `INSERT`, `UPDATE`, and `DELETE` access from `land_improvements`.
- Kept authenticated `SELECT` on building/land tables, still constrained by Stage 1 scoped SELECT policies.
- Removed direct authenticated `SELECT`, `INSERT`, `UPDATE`, and `DELETE` from `form_locks`.
- Added explicit `TO service_role` management policy for `form_locks`.
- Recreated `tax_declarations` service-role management policy with explicit `TO service_role`.
- Recreated `form_review_history` service-role management policy with explicit `TO service_role`.
- Dropped the old direct `building_structures` super-admin delete policy because server-side routes use service role.

## Verification

Build check:
- `npm run build` passed.

Live privilege checks:

| Role | Table | Privilege | Result |
| --- | --- | --- | --- |
| `authenticated` | `public.building_structures` | `UPDATE` | `false` |
| `authenticated` | `public.building_structures` | `INSERT` | `false` |
| `authenticated` | `public.building_structures` | `DELETE` | `false` |
| `authenticated` | `public.building_structures` | `SELECT` | `true` |
| `authenticated` | `public.land_improvements` | `UPDATE` | `false` |
| `authenticated` | `public.land_improvements` | `INSERT` | `false` |
| `authenticated` | `public.land_improvements` | `DELETE` | `false` |
| `authenticated` | `public.land_improvements` | `SELECT` | `true` |
| `authenticated` | `public.form_locks` | `SELECT` | `false` |
| `authenticated` | `public.form_locks` | `INSERT` | `false` |
| `authenticated` | `public.form_locks` | `UPDATE` | `false` |
| `authenticated` | `public.form_locks` | `DELETE` | `false` |

Live metadata:
- `building_structures` grants now show authenticated `SELECT` only.
- `land_improvements` grants now show authenticated `SELECT` only.
- `form_locks` grants now show service-role access only.
- `form_locks` policy is `Service role manages form locks` with roles `{service_role}`.
- `tax_declarations` service management policy now has roles `{service_role}`.
- `form_review_history` service management policy now has roles `{service_role}`.

## Still Pending

These were not part of Stage 3 and remain for later stages:
- Cross-municipality IDORs in building/land single-record GET/PUT, assign, review, submit, comments, and upload flows.
- Photo upload parent-record authorization.
- Comment author-role verification and comment record scoping.
- MIME sniffing, localStorage draft hygiene, service proxy hardening, and clean migration archival.
