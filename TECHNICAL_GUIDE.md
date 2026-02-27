# RPFAAS System — Technical Reference

> Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + PostgreSQL + Storage) · shadcn/ui

---

## Project Structure (Key Paths)

```
forms/
├── app/
│   ├── api/
│   │   ├── auth/user/route.ts               ← session user + role lookup
│   │   ├── my-permissions/route.ts          ← role permission defaults + DB overrides
│   │   ├── review-queue/route.ts            ← GET submitted/under_review forms (all types)
│   │   ├── users/
│   │   │   ├── route.ts                     ← GET all users, POST create user
│   │   │   └── [id]/route.ts               ← PATCH update, DELETE user
│   │   ├── role-permissions/route.ts        ← GET/PATCH permission matrix
│   │   └── building-other-structure/
│   │       ├── route.ts                     ← POST create new FAAS
│   │       └── [id]/
│   │           ├── route.ts                 ← GET, PUT, DELETE single FAAS
│   │           ├── submit/route.ts          ← POST: draft→submitted transition
│   │           ├── review/route.ts          ← POST: claim/return/approve transitions
│   │           └── comments/route.ts        ← GET list, POST add comment
│   ├── building-other-structure/
│   │   ├── dashboard/page.tsx               ← Tax Mapper's form list
│   │   └── fill/
│   │       ├── step-1/ through step-6/      ← Multi-step FAAS form
│   │       └── preview-form/page.tsx        ← Preview + Submit + Save Draft
│   ├── review-queue/
│   │   ├── page.tsx                         ← LAOO queue list with filters
│   │   └── [id]/page.tsx                   ← Review detail: form data + comments + actions
│   ├── manage-users/page.tsx                ← Super Admin user CRUD
│   ├── manage-roles/page.tsx                ← Super Admin permission matrix
│   └── types/user.ts                        ← UserRole, User, CreateUserData, UpdateUserData
├── components/
│   └── app-sidebar.tsx                      ← Permission-gated navigation
├── database/
│   ├── schema.sql                           ← Initial table definitions
│   ├── role_permissions_migration.sql       ← role_permissions table + seed
│   ├── photos_migration.sql                 ← building_structure_photos table
│   ├── 20260225_review_workflow_migration.sql ← Review workflow tables + columns
│   └── 20260225_patch_revert_role_rename.sql  ← Keeps municipal_tax_mapper, adds review.sign
└── WORKFLOW_GUIDE.md                        ← Non-technical user guide
```

---

## Database Schema

### Tables Added by `20260225_review_workflow_migration.sql`

#### `form_comments`
Per-field comments by LAOO on a FAAS form. Tax mapper replies via `parent_id`.

```sql
id               UUID        PRIMARY KEY DEFAULT gen_random_uuid()
form_type        TEXT        CHECK IN ('building_structures','land_improvements','machinery')
form_id          INTEGER     -- FK to the FAAS table row
field_name       TEXT        -- NULL = general comment
comment_text     TEXT        NOT NULL
suggested_value  TEXT        -- LAOO's recommended correction
author_id        UUID        -- auth.uid()
author_role      TEXT        CHECK IN ('laoo','tax_mapper','municipal_tax_mapper',...)
parent_id        UUID        REFERENCES form_comments(id)  -- for threaded replies
is_resolved      BOOLEAN     DEFAULT false
created_at       TIMESTAMPTZ DEFAULT NOW()
updated_at       TIMESTAMPTZ DEFAULT NOW()
```

#### `form_attachments`
Supporting documents uploaded by either party.

```sql
id                  UUID    PRIMARY KEY
form_type           TEXT
form_id             INTEGER                 -- set for FAAS attachments
tax_declaration_id  UUID                    -- set for Tax Declaration attachments
comment_id          UUID    REFERENCES form_comments(id)
uploaded_by         UUID    NOT NULL
uploader_role       TEXT    NOT NULL
file_name           TEXT    NOT NULL
file_path           TEXT    NOT NULL        -- Supabase Storage path
file_size           INTEGER
uploaded_at         TIMESTAMPTZ DEFAULT NOW()
```

#### `tax_declarations`
Auto-created when a FAAS is approved by LAOO.

```sql
id                 UUID    PRIMARY KEY
form_type          TEXT
form_id            INTEGER NOT NULL         -- the approved FAAS row
tax_declaration_no TEXT    UNIQUE           -- e.g. TD-2026-00001
property_snapshot  JSONB                    -- FAAS values at approval time
status             TEXT    DEFAULT 'unlocked'
                   CHECK IN ('unlocked','completed','for_signature','finalized')
completed_by       UUID
completed_at       TIMESTAMPTZ
signed_by          UUID
signed_at          TIMESTAMPTZ
signature_data     TEXT                     -- Supabase Storage path
created_at         TIMESTAMPTZ DEFAULT NOW()
updated_at         TIMESTAMPTZ DEFAULT NOW()
```

#### `form_review_history`
Immutable audit log — never updated or deleted.

```sql
id          UUID    PRIMARY KEY
form_type   TEXT    NOT NULL
form_id     INTEGER                -- FAAS row
form_stage  TEXT    CHECK IN ('faas','tax_declaration')
td_id       UUID                   -- Tax Declaration row (if stage = tax_declaration)
from_status TEXT
to_status   TEXT    NOT NULL
actor_id    UUID
actor_role  TEXT
note        TEXT
created_at  TIMESTAMPTZ DEFAULT NOW()
```

### Columns Added to Existing Tables

#### `building_structures` / `land_improvements` / `machinery`
```sql
submitted_at       TIMESTAMPTZ    -- set when tax mapper submits
laoo_reviewer_id   UUID           -- set when LAOO claims (under_review)
laoo_approved_at   TIMESTAMPTZ    -- set when LAOO approves
tax_declaration_id UUID           -- set when Tax Declaration is created
```

#### `users`
```sql
municipality  TEXT        -- scopes LAOO/MTM to their municipality; NULL = province-wide
laoo_level    SMALLINT    -- 1–4, informational only
```

---

## API Reference

### Authentication Pattern
All protected routes use the same two-client pattern:

```typescript
// Session client (reads auth cookie, respects RLS)
const sessionClient = await createClient();
const { data: { user: authUser } } = await sessionClient.auth.getUser();

// Admin client (service role key, bypasses RLS)
const admin = createAdminClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Fetch user profile + role from users table
const { data: profile } = await admin
  .from('users').select('role, municipality').eq('id', authUser.id).single();
```

---

### `GET /api/review-queue`

Returns all submitted/under_review FAAS forms across building_structures and land_improvements.

**Auth:** LAOO, APA, PA, Admin, Super Admin

**Query params:**
| Param | Values | Default |
|---|---|---|
| `status` | `submitted` \| `under_review` \| `approved` \| `returned` | both submitted + under_review |
| `form_type` | `building` \| `land` | both |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "form_type": "building",
      "form_label": "Building & Structure",
      "owner_name": "Juan Dela Cruz",
      "location_municipality": "Bontoc",
      "location_barangay": "Poblacion",
      "status": "submitted",
      "submitted_at": "2026-02-25T10:30:00Z",
      "laoo_reviewer_id": null
    }
  ]
}
```

**LAOO scoping:** If the LAOO user has a `municipality` value in their profile, the query is filtered to `WHERE location_municipality = profile.municipality`. If NULL, they see all municipalities.

---

### `POST /api/building-other-structure/[id]/submit`

Transitions a FAAS from `draft` or `returned` → `submitted`.

**Auth:** tax_mapper, municipal_tax_mapper, admin, super_admin

**Body:** `{}` (empty — form data must be saved via PUT before calling this)

**Status machine:**
```
draft     → submitted  ✓
returned  → submitted  ✓
submitted → submitted  ✗ 409
under_review → ...     ✗ 409
```

**What it does:**
1. Checks auth + role
2. Fetches current status, rejects if not in `['draft', 'returned']`
3. Updates: `status = 'submitted'`, `submitted_at = NOW()`, `updated_at = NOW()`
4. Writes to `form_review_history` (non-blocking — wrapped in try/catch)

---

### `POST /api/building-other-structure/[id]/review`

LAOO status transitions: claim, return, or approve a form.

**Auth:** laoo, assistant_provincial_assessor, provincial_assessor, admin, super_admin

**Body:**
```json
{ "action": "claim" | "return" | "approve", "note": "optional note" }
```

**Transition table:**
| action | from_status | to_status | side effects |
|---|---|---|---|
| `claim` | `submitted` | `under_review` | sets `laoo_reviewer_id` |
| `return` | `under_review` | `returned` | — |
| `approve` | `under_review` | `approved` | sets `laoo_reviewer_id`, `laoo_approved_at` |

All transitions write to `form_review_history` (non-blocking).

---

### `GET /api/building-other-structure/[id]/comments`

Returns all comments for a FAAS form, enriched with author display names.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "field_name": "market_value",
      "comment_text": "Value seems too high for this area.",
      "suggested_value": "250000",
      "author_id": "uuid",
      "author_name": "Maria Santos",
      "author_role": "laoo",
      "parent_id": null,
      "is_resolved": false,
      "created_at": "2026-02-25T11:00:00Z"
    }
  ]
}
```

---

### `POST /api/building-other-structure/[id]/comments`

Adds a comment to a FAAS form.

**Body:**
```json
{
  "field_name": "market_value",    // optional — null means general comment
  "comment_text": "Needs correction.",
  "suggested_value": "250000",     // optional
  "parent_id": null                // optional — for threaded replies
}
```

---

## FAAS Status State Machine

```
                    [tax mapper]
    draft ──────────────────────────► submitted
      ▲                                   │
      │           [LAOO claim]            │
      │                                   ▼
      │                             under_review
      │                             │         │
      │         [LAOO return]       │         │  [LAOO approve]
      │◄────────────────────────────┘         │
    returned                                  ▼
      │                                   approved
      │  [tax mapper resubmit]                │
      └───────────────────────────────────────►  (tax_declaration created)
```

The `submitted_at` timestamp is set on first submission and **NOT overwritten** on resubmit. `laoo_approved_at` is only set on approve.

---

## Permission System

### How It Works

1. Every role has a set of feature flags stored in `role_permissions` table: `(role, feature, allowed)`
2. On login, `GET /api/my-permissions` merges hard-coded defaults with DB overrides
3. `super_admin` always gets all permissions — no DB lookup needed
4. The `can(feature)` function in the frontend checks the returned permission map

### Permission Features (23 total)

```
building_structures.{view,create,edit,delete}
land_improvements.{view,create,edit,delete}
machinery.{view,create,edit,delete}
user_management.{view,create,edit,delete}
role_management.{view,edit}
accounting.view
dashboard.view
forms.submit        ← new: who can submit FAAS for review
review.laoo         ← new: who can open, comment, return, approve FAAS
review.sign         ← new: who can sign Tax Declarations
```

### Role Defaults

| Role | forms.submit | review.laoo | review.sign |
|---|---|---|---|
| super_admin | ✓ | ✓ | ✓ |
| admin | ✓ | ✗ | ✗ |
| tax_mapper | ✓ | ✗ | ✗ |
| municipal_tax_mapper | ✓ | ✗ | ✓ |
| laoo | ✗ | ✓ | ✗ |
| assistant_provincial_assessor | ✗ | ✗ | ✓ |
| provincial_assessor | ✗ | ✗ | ✓ |
| accountant | ✗ | ✗ | ✗ |
| user | ✗ | ✗ | ✗ |

---

## Frontend Data Flow

### Submit for Review (preview-form/page.tsx)

```
User clicks "Submit for Review"
  │
  ├─ confirm() dialog
  │
  ├─ PUT /api/building-other-structure/[id]
  │    body: collectFormData() — reads localStorage, filters invalid keys
  │    skips: JSON object blobs, 'id', 'created_at', 'updated_at', 'unit_cost'
  │
  └─ POST /api/building-other-structure/[id]/submit
       body: {}
       → status: submitted, submitted_at: now
       → redirect to /building-other-structure/dashboard
```

### Review Queue Load (review-queue/page.tsx)

```
Page mount
  │
  ├─ GET /api/auth/user  → check role is in REVIEW_ROLES
  │
  └─ GET /api/review-queue?status=...&form_type=...
       → setItems(json.data)
       → render table with pagination + municipality filter (client-side)
```

### Review Detail Load (review-queue/[id]/page.tsx)

```
Page mount
  │
  ├─ GET /api/auth/user
  │
  ├─ GET /api/building-other-structure/[id]   → form record
  └─ GET /api/building-other-structure/[id]/comments → comments list
       (both fetched in parallel via Promise.all)
```

### Review Actions (review-queue/[id]/page.tsx)

```
LAOO clicks action button
  │
  ├─ confirm() dialog
  │
  ├─ POST /api/building-other-structure/[id]/review
  │    body: { action: 'claim' | 'return' | 'approve' }
  │
  └─ loadData() → refetch form + comments
```

---

## localStorage Key Conventions (Form Steps)

The multi-step form uses localStorage for in-progress data:

| Key pattern | Set by | Contains |
|---|---|---|
| `draft_id` | step-1 on create | The DB row ID |
| `rpfaas_owner_name` | step-1 | Owner name string |
| `rpfaas_location_*` | step-1 | Location codes |
| `p2` | step-2 via useFormPersistence | JSON blob of all step-2 fields |
| `p3`, `p4` | step-3, step-4 | JSON blobs |
| `unit_cost_p2` | step-2 | Unit construction cost (NOT a DB column) |
| `market_value_p4` | step-4 | Calculated market value |
| `assessment_level_p5` | step-5 | Assessment level percentage |
| `assessed_value_p5` | step-5 | Final assessed value |
| `amount_in_words_p5` | step-5 | Amount in words |

**Important:** `collectFormData()` in `preview-form/page.tsx` scans all localStorage keys matching `_p[1-6]` and strips the suffix to derive DB column names. It skips:
- Values starting with `{` (JSON object blobs from `useFormPersistence`)
- Keys `id`, `created_at`, `updated_at`, `unit_cost`

---

## Key Design Decisions

### Why separate `/submit` and `/review` endpoints instead of a single PATCH?

Separation of concerns. `/submit` is called by tax mappers (and validates their role). `/review` is called by LAOO (and validates a different set of roles). Merging them would require complex role-branching logic in one route.

### Why is `form_review_history` insert non-blocking (try/catch)?

The migration adds this table, but if someone runs the code before applying the migration, a missing table would crash the submit/review flow. Making the audit log non-blocking ensures the core status transition always succeeds.

### Why doesn't the submit endpoint accept form field data in its body?

Early implementation spread all localStorage keys into the update payload, which caused failures when non-existent column names were sent (e.g. `unit_cost`, `building_other_structure_fill`). The fix: step pages save field data via PUT, and `/submit` only does the status transition with known-safe columns.

### Why is LAOO municipality scoping optional?

A LAOO with `municipality = NULL` in their profile sees all municipalities (province-wide access). One with a specific municipality sees only that municipality's forms. This allows flexibility for both province-wide LAOOs and municipality-specific assignments.

---

## Pending Work (Next Steps)

| Step | Files to Create |
|---|---|
| Tax mapper sees LAOO comments on returned form | `preview-form/page.tsx` — fetch + display comments, reply flow |
| Tax Declaration form unlock | `app/api/building-other-structure/[id]/review/route.ts` — create tax_declaration on approve; new `app/tax-declarations/[id]/page.tsx` |
| Signature queue | `app/signature-queue/page.tsx`, `app/api/signature-queue/route.ts` |
| Land Improvements submit + review | Mirror of building-other-structure routes for `land_improvements` table |
| `form_comments` constraint fix | The `author_role` CHECK still lists `municipal_assessor` — needs updating to `municipal_tax_mapper` via ALTER TABLE |
