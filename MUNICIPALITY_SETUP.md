# Municipality Access Control — Setup Guide

This document covers every step taken to add municipality-based data scoping to the RPFAAS system.

---

## Municipalities

| Value | Display Name |
|-------|-------------|
| `barlig` | Barlig |
| `bauko` | Bauko |
| `besao` | Besao |
| `bontoc` | Bontoc |
| `natonin` | Natonin |
| `paracellis` | Paracellis |
| `sabangan` | Sabangan |
| `sagada` | Sagada |
| `sadanga` | Sadanga |
| `tadian` | Tadian |

---

## Access Control Rules

| User Type | Data Visible |
|-----------|-------------|
| `super_admin` | All records, all municipalities |
| `admin` | All records, all municipalities |
| User **with** municipality assigned | Only records tagged with their municipality |
| User **without** municipality | All records (backward compatible) |

---

## Step 1 — Run the SQL Migration

Open the Supabase dashboard SQL editor and run **`ADD_MUNICIPALITY.sql`**.

### What it does

1. **Adds `municipality` column to `users`**
   ```sql
   ALTER TABLE public.users ADD COLUMN IF NOT EXISTS municipality VARCHAR(50);
   ```

2. **Adds `municipality` column to all data tables**
   ```sql
   ALTER TABLE public.building_structures ADD COLUMN IF NOT EXISTS municipality VARCHAR(50);
   ALTER TABLE public.land_improvements   ADD COLUMN IF NOT EXISTS municipality VARCHAR(50);
   ALTER TABLE public.machinery           ADD COLUMN IF NOT EXISTS municipality VARCHAR(50);
   ```

3. **Creates indexes** for fast municipality-based filtering on all four tables.

4. **Replaces RLS SELECT policies** on data tables with municipality-scoped ones:
   - Admins (`admin`, `super_admin`) see everything.
   - Users with a municipality only see records where `municipality` matches their own.
   - Users with no municipality see everything (backward compatibility).

> **Where to run:**
> Supabase Dashboard → SQL Editor → New Query → paste file contents → Run

---

## Step 2 — Types (`app/types/user.ts`)

Added:

```ts
export type Municipality =
  | 'barlig' | 'bauko' | 'besao' | 'bontoc' | 'natonin'
  | 'paracellis' | 'sabangan' | 'sagada' | 'sadanga' | 'tadian';

export const MUNICIPALITIES: Municipality[] = [ ... ];

export const MUNICIPALITY_LABELS: Record<Municipality, string> = { ... };
```

Updated `User`, `CreateUserData`, `UpdateUserData`, and `UserProfile` to include:

```ts
municipality?: Municipality | null;
```

---

## Step 3 — User Management APIs

### `POST /api/users` — Create user

Extracts `municipality` from the request body and saves it to the user profile:

```ts
const { email, password, full_name, role, municipality, ... } = body;

await admin.from('users').update({
  role: role || 'user',
  municipality: municipality || null,
  ...
}).eq('id', newAuthUser.user.id);
```

### `PATCH /api/users/[id]` — Update user

Accepts and saves `municipality`:

```ts
const { full_name, role, municipality, ... } = body;

await admin.from('users').update({
  municipality: municipality ?? null,
  ...
}).eq('id', userId);
```

---

## Step 4 — Manage Users Page (`app/manage-users/page.tsx`)

### New `MunicipalitySelect` component

A reusable dropdown that renders all municipalities plus a "No municipality" option.

### Create User dialog

Added a **Municipality** dropdown below the Role field.
Resets to `null` after a user is successfully created.

### Edit User dialog

Pre-fills the current user's municipality.
Saving sends the selected value (or `null`) to the PATCH API.

### Users table

Added a **Municipality** column that shows a badge for assigned municipalities or `—` for none.

---

## Step 5 — Form Listing APIs (municipality-scoped reads)

All four listing/count APIs were updated to:

1. Get the authenticated user from the Supabase session.
2. Look up their `role` and `municipality` from the `users` table.
3. Apply a `.eq('municipality', ...)` filter when the user is not an admin and has a municipality assigned.

### Files changed

| File | Change |
|------|--------|
| `app/api/forms/building-structures/route.ts` | Auth check + municipality filter on GET |
| `app/api/forms/land-other-improvements/route.ts` | Auth check + municipality filter on GET |
| `app/api/forms/machinery/route.ts` | Auth check + municipality filter on GET |
| `app/api/forms/counts/route.ts` | Auth check + municipality filter on all four counts |

### Filter logic (same across all)

```ts
// Only filter if the user is not an admin AND has a municipality set
if (!userCtx.isAdmin && userCtx.municipality) {
  query = query.eq('municipality', userCtx.municipality)
}
```

> The global `unstable_cache` was removed from these routes because cached responses cannot be filtered per user.

---

## Step 6 — Record Creation APIs (municipality auto-stamp)

When a non-admin user creates a new record, their municipality is automatically stamped server-side so they cannot forge a different municipality.

### `POST /api/building-other-structure`

```ts
const { data: { user: authUser } } = await supabase.auth.getUser();
if (authUser) {
  const { data: profile } = await admin
    .from('users').select('municipality, role').eq('id', authUser.id).single();
  if (profile?.municipality && !['admin', 'super_admin'].includes(profile.role)) {
    data.municipality = profile.municipality;
  }
}
```

### `POST /api/land-other-improvements`

Same pattern — gets the server session, looks up the user's municipality, stamps it on the insert body before saving.

### `POST /api/forms/building-structures` and `POST /api/forms/land-other-improvements`

Same municipality stamping applied in these alternative creation endpoints.

---

## Post-Deployment Checklist

- [ ] Run `ADD_MUNICIPALITY.sql` in Supabase SQL editor
- [ ] Deploy updated application code
- [ ] Go to **Manage Users** and assign a municipality to each non-admin user
- [ ] Verify that a user assigned to e.g. *Bontoc* cannot see records from *Sagada*
- [ ] Verify that `super_admin` / `admin` can still see all records

---

## Files Changed

```
ADD_MUNICIPALITY.sql                              ← new (run in Supabase)
app/types/user.ts                                 ← Municipality type + labels
app/api/users/route.ts                            ← POST accepts municipality
app/api/users/[id]/route.ts                       ← PATCH accepts municipality
app/manage-users/page.tsx                         ← UI: dropdown + table column
app/api/forms/building-structures/route.ts        ← auth + municipality filter
app/api/forms/land-other-improvements/route.ts    ← auth + municipality filter
app/api/forms/machinery/route.ts                  ← auth + municipality filter
app/api/forms/counts/route.ts                     ← auth + municipality filter
app/api/building-other-structure/route.ts         ← municipality stamp on insert
app/api/land-other-improvements/route.ts          ← municipality stamp on insert
```
