# RPFAAS — Complete Setup Checklist
*Everything done across all sessions, in the order it was built.*
*Follow this top to bottom to recreate the entire system from scratch.*

---

## Prerequisites

Make sure you have these before starting:
- Node.js 18+ installed
- A Supabase project created (get the URL and keys from Project Settings → API)
- `.env.local` file in the project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- Run `npm install` once to install all dependencies

---

## Step 1 — Run the Database Migrations (Supabase SQL Editor)

Go to your **Supabase Dashboard → SQL Editor → New Query**.
Run each file below **in this exact order**. Paste the contents and click Run.

### 1a. Initial Schema (`database/schema.sql`)
Creates the base tables: `building_structures`, `land_improvements`, `machinery`, `users`.

### 1b. Role Permissions (`database/role_permissions_migration.sql`)
Creates the `role_permissions` table and seeds default permissions for all roles.

### 1c. Photos (`database/photos_migration.sql`)
Creates `building_structure_photos` table for attached images.

### 1d. Review Workflow (`database/20260225_review_workflow_migration.sql`)
This is the largest migration. It:
- Adds `municipality` and `laoo_level` columns to `users`
- Adds `submitted_at`, `laoo_reviewer_id`, `laoo_approved_at`, `tax_declaration_id` to FAAS tables
- Creates `form_comments`, `form_attachments`, `tax_declarations`, `form_review_history` tables
- Seeds permissions for `laoo`, `assistant_provincial_assessor`, `provincial_assessor`
- Adds `forms.submit`, `review.laoo`, `review.sign` permission features

> ⚠️ This migration also renames `municipal_tax_mapper` → `municipal_assessor` by mistake. Run the patch immediately after.

### 1e. Patch (`database/20260225_patch_revert_role_rename.sql`)
Fixes the accidental rename. Run this right after 1d.
- Renames `municipal_assessor` back to `municipal_tax_mapper` in role_permissions
- Gives `municipal_tax_mapper` the `review.sign = true` permission

### Verify the migration worked
Run this in SQL Editor:
```sql
-- Should return 'municipal_tax_mapper' rows (not municipal_assessor)
SELECT role, feature, allowed FROM role_permissions
WHERE role = 'municipal_tax_mapper'
AND feature IN ('forms.submit', 'review.laoo', 'review.sign');

-- Should show 4 new columns on building_structures
SELECT column_name FROM information_schema.columns
WHERE table_name = 'building_structures'
AND column_name IN ('submitted_at','laoo_reviewer_id','laoo_approved_at','tax_declaration_id');

-- Should show 4 new tables
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('form_comments','form_attachments','tax_declarations','form_review_history');
```

---

## Step 2 — Fix the `form_comments` Constraint (Known Issue)

The migration created `form_comments` with an `author_role` CHECK that still lists `municipal_assessor` instead of `municipal_tax_mapper`. Run this in SQL Editor to fix it:

```sql
ALTER TABLE form_comments DROP CONSTRAINT IF EXISTS form_comments_author_role_check;

ALTER TABLE form_comments ADD CONSTRAINT form_comments_author_role_check
  CHECK (author_role IN (
    'laoo',
    'tax_mapper',
    'municipal_tax_mapper',
    'admin',
    'super_admin',
    'assistant_provincial_assessor',
    'provincial_assessor'
  ));
```

---

## Step 3 — Add New Columns to `users` Table (If Not Already There)

The migration adds `municipality` and `laoo_level` to `users`. If your `users` table was created differently, add them manually:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS municipality TEXT,
  ADD COLUMN IF NOT EXISTS laoo_level SMALLINT
    CHECK (laoo_level IS NULL OR laoo_level BETWEEN 1 AND 4);
```

---

## Step 4 — Code Changes (What Files Were Modified)

### 4a. `app/types/user.ts`
Added new roles and new fields to all user interfaces.

Key change — extend the `UserRole` type:
```typescript
export type UserRole =
  | "super_admin"
  | "admin"
  | "tax_mapper"
  | "municipal_tax_mapper"
  | "laoo"                          // ← new
  | "assistant_provincial_assessor" // ← new
  | "provincial_assessor"           // ← new
  | "accountant"
  | "user";
```

Add to `User`, `CreateUserData`, `UpdateUserData` interfaces:
```typescript
laoo_level?: number | null;   // ← new field
```

---

### 4b. `app/api/my-permissions/route.ts`
Added default permission sets for the 3 new roles and the 3 new permission features.

Pattern — every role needs entries for the new features:
```typescript
// Add to each existing role's defaults:
"forms.submit": true/false,
"review.laoo":  false,
"review.sign":  false,

// Add complete defaults for new roles:
laoo: {
  "building_structures.view": true,
  "building_structures.create": false,
  // ... (view only for all FAAS)
  "forms.submit": false,
  "review.laoo":  true,   // ← this is what makes LAOO special
  "review.sign":  false,
}
```

---

### 4c. `app/manage-roles/page.tsx`
Added the 3 new roles to the UI permission matrix.

Key additions:
```typescript
// Add to ROLES array:
{ value: "laoo", label: "LAOO", short: "LAOO" },
{ value: "assistant_provincial_assessor", label: "Assistant Provincial Assessor", short: "APA" },
{ value: "provincial_assessor", label: "Provincial Assessor", short: "PA" },

// Add to MODULES array (new section):
{
  label: "Review & Workflow",
  features: [
    { key: "forms.submit", label: "Submit Forms" },
    { key: "review.laoo",  label: "LAOO Review" },
    { key: "review.sign",  label: "Sign Documents" },
  ]
}
```

---

### 4d. `components/app-sidebar.tsx`
Added two new sidebar sections gated by permissions.

Pattern used:
```tsx
{/* Only shows for LAOO */}
{can("review.laoo") && (
  <SidebarGroup>
    <SidebarGroupLabel>Provincial Review</SidebarGroupLabel>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href="/review-queue">
          <ClipboardList />
          <span>Review Queue</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarGroup>
)}

{/* Only shows for MTM, APA, PA */}
{can("review.sign") && (
  <SidebarGroup>
    <SidebarGroupLabel>Signatures</SidebarGroupLabel>
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href="/signature-queue">
          <PenLine />
          <span>Signature Queue</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarGroup>
)}
```

---

### 4e. `app/manage-users/page.tsx`
Added all 9 roles to the Add/Edit User dialogs.

Key additions:
```typescript
// Role labels map (must include all 9 roles):
const ROLE_LABELS: Record<UserRole, string> = {
  laoo: "LAOO (Local Assessment Operations Officer)",
  assistant_provincial_assessor: "Assistant Provincial Assessor",
  provincial_assessor: "Provincial Assessor",
  // ... existing roles
};

// Roles that need municipality assigned:
const MUNICIPALITY_ROLES: UserRole[] = ["tax_mapper", "municipal_tax_mapper", "laoo"];

// Roles that have LAOO level:
const LAOO_ROLES: UserRole[] = ["laoo"];
```

In the dialog JSX, show fields conditionally:
```tsx
{/* Required municipality for MUNICIPALITY_ROLES */}
{MUNICIPALITY_ROLES.includes(form.role ?? "user") && (
  <div>
    <Label>Municipality <span className="text-red-400">*</span></Label>
    <MunicipalitySelect ... />
    <p className="text-xs">Required for this role</p>
  </div>
)}

{/* LAOO level selector */}
{LAOO_ROLES.includes(form.role ?? "user") && (
  <div>
    <Label>LAOO Level</Label>
    <select ...>
      <option value="1">LAOO I</option>
      <option value="2">LAOO II</option>
      <option value="3">LAOO III</option>
      <option value="4">LAOO IV</option>
    </select>
  </div>
)}
```

---

### 4f. `app/building-other-structure/fill/preview-form/page.tsx`
Three changes:

**1. Fixed `collectFormData()` to skip invalid DB keys:**
```typescript
const SKIP_KEYS = new Set(["id", "created_at", "updated_at", "unit_cost"]);

function collectFormData() {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (!key.match(/_p[1-6]/)) continue;           // only _p1 through _p6 keys

    const value = localStorage.getItem(key);
    if (!value) continue;
    if (value.trimStart().startsWith("{")) continue; // skip JSON blobs (whole-step state)

    const cleanKey = key.replace(/_p[0-9]$/, "");
    if (SKIP_KEYS.has(cleanKey)) continue;           // skip non-columns

    data[cleanKey] = value;
  }
  return data;
}
```

**2. Added status fetching on load** (to show the right status banner):
```typescript
useEffect(() => {
  if (!currentDraftId) return;
  fetch(`/api/building-other-structure/${currentDraftId}`)
    .then(r => r.json())
    .then(json => {
      if (json.data?.status) setFormStatus(json.data.status);
    });
}, [currentDraftId]);
```

**3. Fixed `handleSubmit` to be a status-only transition:**
```typescript
const handleSubmit = async () => {
  // 1. Save form data first (PUT)
  await fetch(`/api/building-other-structure/${id}`, {
    method: "PUT",
    body: JSON.stringify(collectFormData()),
  });

  // 2. Change status only (POST /submit)
  const res = await fetch(`/api/building-other-structure/${id}/submit`, {
    method: "POST",
    body: JSON.stringify({}),  // ← empty body, no form data
  });

  if (res.ok) {
    localStorage.clear();
    router.push("/building-other-structure/dashboard");
  }
};
```

---

## Step 5 — New API Routes Created

### Standard API Route Template
Every route in this project follows this pattern:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // ── 1. Resolve params (Next.js 15 requires this) ──────────────────────────
    const params = await Promise.resolve(context.params);
    const id = params.id;

    // ── 2. Auth check ─────────────────────────────────────────────────────────
    const sessionClient = await createClient();
    const { data: { user: authUser }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 3. Role check ─────────────────────────────────────────────────────────
    const admin = getAdmin();
    const { data: profile } = await admin
      .from('users').select('role, municipality').eq('id', authUser.id).single();

    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── 4. Business logic ─────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    // ... do work ...

    // ── 5. Response ───────────────────────────────────────────────────────────
    return NextResponse.json({ success: true, data: result });

  } catch (err) {
    console.error('Route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

### Files Created
| File | Method | Purpose |
|---|---|---|
| `app/api/building-other-structure/[id]/submit/route.ts` | POST | draft/returned → submitted |
| `app/api/building-other-structure/[id]/review/route.ts` | POST | claim / return / approve |
| `app/api/building-other-structure/[id]/comments/route.ts` | GET + POST | list and add comments |
| `app/api/review-queue/route.ts` | GET | all submitted/under_review forms |

---

## Step 6 — New Pages Created

### Standard Page Template
Every page follows this pattern:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// ... other imports

export default function MyPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── 1. Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/user")
      .then(r => r.json())
      .then(data => {
        const u = data.user;
        const allowed = ["laoo", "admin", "super_admin"]; // roles that can see this page
        if (!u || !allowed.includes(u.role)) {
          router.replace("/dashboard"); // redirect if not allowed
        } else {
          setCurrentUser(u);
        }
      })
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false));
  }, [router]);

  // ── 2. Data fetch (runs after auth) ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    const res = await fetch("/api/my-endpoint");
    const json = await res.json();
    setData(json.data ?? []);
  }, []);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser, fetchData]);

  // ── 3. Render ──────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner />;
  if (!currentUser) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header>...</header>
        <div className="flex-1 p-6">
          {/* page content */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

### Files Created
| File | Who Sees It | Purpose |
|---|---|---|
| `app/review-queue/page.tsx` | LAOO, APA, PA, Admin | Queue list with filters and action dialogs |
| `app/review-queue/[id]/page.tsx` | LAOO, APA, PA, Admin | Form detail + comments + approve/return buttons |

---

## Step 7 — Status Flow Reference

### FAAS Status Values
```
draft        → Tax mapper filling the form
submitted    → Sent to LAOO (locked for tax mapper)
under_review → LAOO has claimed it
returned     → LAOO returned with comments (editable again)
approved     → LAOO approved (Tax Declaration created)
```

### Valid Transitions
| From | To | Who | How |
|---|---|---|---|
| `draft` | `submitted` | Tax Mapper | Preview page → Submit for Review |
| `returned` | `submitted` | Tax Mapper | Preview page → Resubmit for Review |
| `submitted` | `under_review` | LAOO | Review Queue → Start Review |
| `under_review` | `returned` | LAOO | Review Detail → Return for Revision |
| `under_review` | `approved` | LAOO | Review Detail → Approve |

### Tax Declaration Status Values (future)
```
unlocked     → Ready for tax mapper to fill
completed    → Tax mapper submitted Tax Declaration
for_signature → In PA / APA queue
finalized    → Signed and locked
```

---

## Step 8 — Role Permissions Summary

Run this in SQL Editor to verify all permissions are correct:
```sql
SELECT role, feature, allowed
FROM role_permissions
WHERE feature IN ('forms.submit', 'review.laoo', 'review.sign')
ORDER BY role, feature;
```

Expected results:
| role | forms.submit | review.laoo | review.sign |
|---|---|---|---|
| super_admin | true | true | true |
| admin | true | false | false |
| tax_mapper | true | false | false |
| municipal_tax_mapper | true | false | true |
| laoo | false | true | false |
| assistant_provincial_assessor | false | false | true |
| provincial_assessor | false | false | true |
| accountant | false | false | false |
| user | false | false | false |

---

## Step 9 — Known Issues and Fixes

### Issue 1: `form_comments` author_role constraint
**Symptom:** Error when LAOO or MTM tries to post a comment.
**Fix:** Run the ALTER TABLE in Step 2 above.

### Issue 2: `unit_cost` column doesn't exist
**Symptom:** "Failed to update draft" when saving from preview page.
**Root cause:** `unit_cost_p2` is stored in localStorage by step-2, and the old `collectFormData()` was sending it to Supabase as if it were a DB column.
**Fix:** Already fixed in `preview-form/page.tsx` — `unit_cost` is in the `SKIP_KEYS` set.

### Issue 3: `building_other_structure_fill_p2` as a column name
**Symptom:** Same as Issue 2.
**Root cause:** `useFormPersistence` stores whole step state as a JSON blob under a key that contains `_p2`. The old `collectFormData()` would pick it up and try to use it as a column name.
**Fix:** Already fixed — `collectFormData()` now skips any value that starts with `{`.

### Issue 4: `updated_by` column doesn't exist
**Symptom:** Submit fails with a 500 error.
**Root cause:** The old submit route tried to set `updated_by: authUser.id` but that column is not in `building_structures` (it exists in `schema.sql` but not in the actual Supabase DB).
**Fix:** Already fixed — submit route only sets `status`, `submitted_at`, `updated_at`.

### Issue 5: Review queue returns plain array but page expected `{ success, data }`
**Symptom:** Review queue page showed empty table even with forms in the DB.
**Fix:** `fetchItems()` now reads `json.data ?? []` instead of treating the whole response as an array.

---

## Step 10 — What's Still To Be Built

In priority order:

### A. Tax Mapper sees LAOO comments on returned form
**Files to touch:**
- `app/building-other-structure/fill/preview-form/page.tsx` — fetch comments when status is `returned`, display them inline

**Logic:**
1. If `formStatus === 'returned'`, fetch `GET /api/building-other-structure/[id]/comments`
2. Show comments panel in preview page so tax mapper can see what to fix
3. Tax mapper clicks "Resubmit" → same submit flow as before

### B. Tax Declaration form unlock
**Files to create:**
- `app/api/building-other-structure/[id]/review/route.ts` — add tax_declaration creation when action is `approve`
- `app/tax-declarations/[id]/page.tsx` — form for tax mapper to fill

**Logic:**
```typescript
// When action === 'approve', also create a tax_declaration row:
await admin.from('tax_declarations').insert({
  form_type: 'building_structures',
  form_id: parseInt(id),
  property_snapshot: record, // the full FAAS record as JSON
  status: 'unlocked',
});
```

### C. Signature Queue
**Files to create:**
- `app/signature-queue/page.tsx` — shows `for_signature` tax declarations
- `app/api/signature-queue/route.ts` — GET tax_declarations with status `completed`

### D. Land Improvements — same submit + review flow
**Files to create (mirror of building routes):**
- `app/api/land-improvements/[id]/submit/route.ts`
- `app/api/land-improvements/[id]/review/route.ts`
- `app/api/land-improvements/[id]/comments/route.ts`

---

## Quick Reference — API Response Shapes

All APIs return one of these two shapes:

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "error": "Human-readable message" }
```

HTTP status codes:
- `200` — OK
- `201` — Created (POST that creates a new record)
- `400` — Bad request (missing required field)
- `401` — Not logged in
- `403` — Logged in but wrong role
- `404` — Record not found
- `409` — Invalid state transition (e.g. submitting an already-submitted form)
- `500` — Server error (check server logs)
