# Standard Operating Procedure (SOP)
## MPAOMIS — Mountain Province Assessor's Office Management Information System
**Document Version:** 2.0
**Date:** May 18, 2026
**Repository:** RinarCOTO/forms

---

## 1. PURPOSE

This document describes the standard operating procedures for the RPFAAS Digital Forms System — the first operational module of MPAOMIS. It covers user roles, step-by-step workflows, form types, system architecture, current feature status, and known gaps as of the current build.

---

## 2. SCOPE

This SOP applies to all personnel involved in property appraisal and assessment within the Mountain Province Assessor's Office, including:

- Municipal Tax Mappers
- Local Assessment Operations Officers (LAOO, Levels I–IV)
- Municipal Assessors
- Assistant Provincial Assessors
- Provincial Assessors
- System and Super Administrators

---

## 3. SYSTEM OVERVIEW

The RPFAAS module replaces manual, paper-based property assessment with a structured digital workflow. It enables:

- Online creation, filling, and per-step auto-save of FAAS forms
- A multi-tier review and approval pipeline (Tax Mapper → Municipal Assessor → LAOO → Provincial Assessor)
- Digital signature by the Provincial Assessor on approved records
- Tax Declaration generation linked to approved FAAS records
- Schedule of Market Values (SMV) reference lookup during assessment
- User and role management with configurable permissions
- Full audit trail on every status change

### 3.1 Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| Authentication | Supabase Auth |
| UI Components | shadcn/ui + Tailwind CSS |
| Storage | Supabase Storage (photos, attachments, signatures) |
| Deployment | Vercel (current) → Self-hosted (Phase 3) |

---

## 4. USER ROLES AND RESPONSIBILITIES

| Role | Municipality Scope | Primary Responsibilities |
|---|---|---|
| **Tax Mapper / Municipal Tax Mapper** | Own municipality | Fill FAAS forms, submit for review, respond to returned forms |
| **Municipal Assessor** | Own municipality | First-tier review: sign forward to LAOO or return to Tax Mapper |
| **LAOO (Levels I–IV)** | Own municipality | Second-tier review: approve to Provincial or return to Municipal |
| **Assistant Provincial Assessor** | Province-wide | Same review actions as Provincial Assessor |
| **Provincial Assessor** | Province-wide | Final approval with digital signature |
| **Admin** | System-wide | View all records; cannot manage roles |
| **Super Admin** | Full access | All of the above + user management + role/permission matrix |

---

## 5. FORM TYPES

### 5.1 Building & Other Structures (FAAS — Building)

A 6-step form covering:

| Step | Content |
|---|---|
| 1 | Owner information, property location, ARP No., PIN, transaction code |
| 2 | Building description, permit details, floor area, occupancy |
| 3 | Structural materials (roof, floor, walls) |
| 4 | Systems, deductions, and additional items |
| 5 | Assessment computation (market value, assessment level, assessed value) |
| 6 | Preview and submit |

### 5.2 Land & Other Improvements (FAAS — Land)

A 6-step form covering:

| Step | Content |
|---|---|
| 1 | Owner information, property location, ARP No., PIN, transaction code |
| 2 | Land classification details |
| 3 | Area and unit measurements |
| 4 | Improvements, additional items, and deductions tables |
| 5 | Supporting documents and photo attachments |
| 6 | Assessment and final valuation; preview and submit |

### 5.3 Machinery (FAAS — Machinery)

A 4-step form covering:

| Step | Content |
|---|---|
| 1 | Owner information, property location, ARP No., PIN, transaction code |
| 2 | Machinery description and specifications |
| 3 | Valuation and cost details |
| 4 | Assessment computation and preview |

> **Note:** The Machinery form currently supports draft save only. The full submit → review → approve workflow for Machinery is not yet wired up.

### 5.4 Transaction Codes

All FAAS forms use a transaction code to identify the nature of the assessment:

| Code | Meaning |
|---|---|
| `ND` | New Discovery — first-time assessment of a property |
| `TR` | Transfer of Ownership |
| `RC` | Reassessment / Reclassification |
| `GR` | General Revision |
| `CN` | Cancellation (Machinery only) |

---

## 6. STANDARD WORKFLOW

### 6.1 Status Flow

```
draft
  ↓  (Tax Mapper submits)
submitted          ← (Tax Mapper resubmits after revision)
  ↓  (Municipal Assessor reviews and signs forward)
municipal_signed
  ↓  (LAOO approves and forwards)
laoo_approved
  ↓  (Provincial Assessor signs and approves)
approved

Parallel return paths:
  Municipal Assessor → returned              (to Tax Mapper)
  LAOO              → returned_to_municipal  (to Municipal Assessor)
  Provincial Assessor → returned_to_municipal
```

| Status | Badge Color | Meaning |
|---|---|---|
| `draft` | Gray | Being filled; not yet submitted |
| `submitted` | Yellow | Awaiting Municipal Assessor review |
| `under_review` | Blue | Reviewer has opened the form |
| `municipal_signed` | Blue | Municipal Assessor signed; awaiting LAOO |
| `laoo_approved` | Indigo | LAOO approved; awaiting Provincial sign |
| `returned` | Orange | Returned to Tax Mapper with comments |
| `returned_to_municipal` | Orange | Returned to Municipal Assessor |
| `approved` | Green | Fully approved by Provincial Assessor |

---

### 6.2 Tax Mapper — Creating and Submitting a Form

1. Open the relevant form type from the sidebar (Building, Land, or Machinery).
2. Click **"New Form"** on the dashboard.
3. Fill each step. Each step saves automatically to the database — no data is lost if the browser closes.
4. A form can be saved as a **Draft** at any step and resumed later.
5. On the final step, click **"Submit for Review"**.
   - Status changes: `draft → submitted`
   - The form is **locked** — no edits until it is returned by a reviewer.

---

### 6.3 Municipal Assessor — First-Tier Review

1. Open **Review Queue** (`/review-queue`).
2. The queue shows all `submitted` and `under_review` forms for the assigned municipality.
3. Click a form to open the review detail page.
4. Review all form data (read-only).
5. Post field-specific comments if corrections are needed.
6. Choose an action:

| Action | Button | Result |
|---|---|---|
| Approve and forward to LAOO | **"Approve & Forward to LAOO"** | Status: `submitted → municipal_signed` |
| Return to Tax Mapper | **"Return to Tax Mapper"** | Status: `submitted → returned` (requires at least 1 comment) |

---

### 6.4 LAOO — Second-Tier Review

1. Open **Review Queue** (`/review-queue`).
2. Forms with status `municipal_signed` appear in the queue.
3. Click a form to open the review detail page.
4. Review all form data and Municipal Assessor comments (read-only).
5. Add field-specific comments as needed.
6. Choose an action:

| Action | Button | Result |
|---|---|---|
| Approve and forward to Provincial | **"Approve & Forward"** | Status: `municipal_signed → laoo_approved` |
| Return to Municipal Assessor | **"Return to Municipal"** | Status: `municipal_signed → returned_to_municipal` (requires at least 1 comment) |

---

### 6.5 Provincial Assessor — Final Approval

1. Open **Review Queue** (`/review-queue`).
2. Forms with status `laoo_approved` appear in the queue.
3. Review all form data, LAOO comments, and prior comment history.
4. Choose an action:

| Action | Button | Result |
|---|---|---|
| Approve (with digital signature) | **"Approve"** | Status: `laoo_approved → approved`; signature stored on record |
| Return to Municipal Assessor | **"Return"** | Status: `laoo_approved → returned_to_municipal` |

> **Requirement:** The Provincial Assessor must have a signature image uploaded on their profile page (`/profile`) before they can approve. The system will reject the approval action if no signature is on file.

---

### 6.6 Tax Mapper — Responding to a Returned Form

1. The form appears on the dashboard with status `returned` (orange badge).
2. Open the form — it is editable again.
3. Open the review detail page to read reviewer comments. Comments are field-specific and may include suggested corrections.
4. Make the required corrections across any step.
5. Click **"Resubmit for Review"** on the preview step.
   - Status changes: `returned → submitted`

---

### 6.7 Comment System

Reviewers at any tier can post comments during review:

- **Field targeting** — each comment is attached to a specific form field (e.g., ARP No., Market Value)
- **Suggested value** — reviewer can suggest the correct value alongside the comment
- **Replies** — Tax Mappers and reviewers can reply to comments in a thread
- **Resolution** — comments can be marked as resolved once addressed
- **Full history** — all comments from all tiers are visible on the review detail page

---

### 6.8 Form Locking

When a reviewer opens a form for review, the system issues a **form lock**. This prevents:
- The Tax Mapper from editing the form while it is under review
- Multiple reviewers from acting on the same form simultaneously

Locks expire automatically. The form-lock banner is visible at the top of the form fill page when a lock is active.

---

## 7. TAX DECLARATION

After a FAAS record is approved:

- A **Tax Declaration (TD)** is auto-generated and linked to the approved FAAS record.
- The TD is accessible from the dashboard via the **"View Tax Declaration"** action.
- If the FAAS carries a `previous_td_no`, the previous TD is automatically cancelled upon approval.
- Tax Declaration views are available for:
  - Land & Other Improvements (`/tax-declaration/land`)
  - Building & Other Structures (`/tax-declaration/building`)
  - Machinery (`/machinery/tax-declaration`) — page routes to form, not yet a standalone TD

---

## 8. DIGITAL SIGNATURE

### 8.1 Uploading a Signature (Provincial Assessor)

1. Navigate to **Profile** (`/profile`).
2. Under **Signature**, click **"Upload Signature"**.
3. Upload a PNG, JPEG, or WebP image. Maximum size: 2 MB.
4. The signature will appear on all forms approved by this user.

### 8.2 Current Limitation

The signature image is stored and attached to the approval record in the database. However, **rendering the signature on the printed/PDF document is currently paused** — the image placeholder in the FAAS footer exists but is not active. This will be enabled once the authentication question around signature display is resolved.

---

## 9. SCHEDULE OF MARKET VALUES (SMV)

Reference tables used during FAAS form filling for computing unit values and assessed values.

### 9.1 Available SMV Tables

| Table | Status |
|---|---|
| Land & Other Improvements — all 10 municipalities | ✅ Available |
| Building & Other Structures | ✅ Available |
| Machinery | ❌ Not yet built |

### 9.2 Navigation

- Land SMV: `/smv/land-other-improvements` → select municipality → select category
- Building SMV: `/smv/building-other-structures`

### 9.3 Updating SMV Data (Developer)

SMV data is stored in static TypeScript files:

```
app/smv/land-other-improvements/data.ts
```

To update values:
1. Open the file and locate the municipality key (e.g., `bontoc`, `sagada`).
2. Edit the relevant rows following the existing structure.
3. Peso values use the format `"₱ 63,480.00"`. Use `"-"` for no value.

---

## 10. USER MANAGEMENT

### 10.1 Creating a New User (Super Admin)

1. Navigate to `/manage-users`.
2. Click **"Add New User"**.
3. Fill in: Full Name, Email, Password, Role, Municipality.
4. For LAOO roles: set LAOO Level (I–IV).
5. Click **"Create User"**.

### 10.2 Editing or Deleting a User

1. Navigate to `/manage-users`.
2. Find the user in the list.
3. Click **Edit** to change details, or **Delete** to remove the account.
4. Changing a user's role or municipality takes effect on their next login.

### 10.3 Managing Role Permissions (Super Admin)

1. Navigate to `/manage-roles`.
2. View the permission matrix by role.
3. Toggle permissions on/off per role. Changes take effect immediately.

**Key Permissions:**

| Permission | Controls |
|---|---|
| `forms.submit` | Ability to submit forms for review |
| `review.laoo` | Access to Review Queue and review actions |
| `review.sign` | Ability to perform final Provincial approval |
| `forms.view` | View FAAS form data |
| `admin.users` | User creation and management |

---

## 11. REFERENCE TABLES (SOURCES)

Beyond SMV, the system maintains reference tables used for building assessment:

| Page | Content |
|---|---|
| `/sources/building` | Building type classifications |
| `/sources/building/deductions` | Standard deduction types |
| `/sources/building/depreciation-table` | Physical depreciation schedule |
| `/sources/land` | Land classification reference |
| `/sources/machinery` | Machinery classification reference |

---

## 12. DATABASE TABLES

| Table | Purpose |
|---|---|
| `building_structures` | Building & Other Structure FAAS records |
| `land_improvements` | Land & Other Improvements FAAS records |
| `machinery` | Machinery FAAS records |
| `users` | User accounts with roles, municipality, and signature path |
| `form_comments` | Field-specific comments with thread support |
| `form_review_history` | Immutable audit log of every status change |
| `tax_declarations` | Auto-created when a FAAS is approved |
| `role_permissions` | Configurable permission matrix per role |
| `form_locks` | Active review locks per form |

---

## 13. KEY API ROUTES

### FAAS — Building & Other Structures

| Method | Route | Purpose |
|---|---|---|
| `GET / POST` | `/api/faas/building-structures` | List all / create new |
| `GET / PUT / DELETE` | `/api/faas/building-structures/[id]` | Get, update, or delete |
| `POST` | `/api/faas/building-structures/[id]/submit` | Submit for review |
| `POST` | `/api/faas/building-structures/[id]/review` | Review actions (sign, return, approve) |
| `GET / POST` | `/api/faas/building-structures/[id]/comments` | View and add comments |
| `GET` | `/api/faas/building-structures/[id]/history` | Audit trail |
| `POST` | `/api/faas/building-structures/[id]/assign` | Assign to Tax Mapper |
| `GET / POST` | `/api/faas/building-structures/photos` | Photo attachments |

### FAAS — Land & Other Improvements

Same route pattern as Building under `/api/faas/land-improvements/`.

### FAAS — Machinery

| Method | Route | Purpose |
|---|---|---|
| `GET / POST` | `/api/faas/machinery` | List all / create new |
| `GET / PUT / DELETE` | `/api/faas/machinery/[id]` | Get, update, or delete |
| `GET / POST` | `/api/faas/machinery/photos` | Photo attachments |

> Submit, review, assign, comments, and history routes are **not yet implemented** for Machinery.

### Auth & Users

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/logout` | Logout |
| `GET` | `/api/auth/user` | Current session user |
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/reset-password` | Password reset |
| `GET / POST / DELETE` | `/api/auth/user/signature` | Current user's signature |
| `GET / POST` | `/api/users` | List / create users |
| `GET / PUT / DELETE` | `/api/users/[id]` | Manage a specific user |
| `GET / POST` | `/api/users/[id]/signature` | Manage signature for any user |
| `POST` | `/api/users/[id]/change-password` | Change password |
| `GET` | `/api/users/by-role` | Filter users by role |
| `GET / PUT` | `/api/users/permissions` | Read/update permission matrix |
| `GET` | `/api/users/role-permissions` | Role permission matrix |

### Other

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/locations` | Province / municipality / barangay data |
| `GET / POST / DELETE` | `/api/form-locks` | Form lock management |
| `GET` | `/api/faas/counts` | Dashboard record counts |
| `GET` | `/api/print/building-structures/[id]` | Print data for Building FAAS |
| `GET` | `/api/print/land-improvements/[id]` | Print data for Land FAAS |
| `GET` | `/api/print/machinery/[id]` | Print data for Machinery FAAS |
| `GET / POST` | `/api/smv/building-structures` | Building SMV data |
| `GET` | `/api/review` | Review queue list |

---

## 14. CURRENT FEATURE STATUS

### Phase 1 — Implemented

| Feature | Status |
|---|---|
| Authentication (login, logout, signup, reset password) | ✅ Done |
| Role-based access control with configurable permissions | ✅ Done |
| User management (create, edit, delete, assign role + municipality) | ✅ Done |
| Building & Other Structures form — 6 steps, per-step save, edit draft | ✅ Done |
| Land & Other Improvements form — 6 steps, per-step save, edit draft | ✅ Done |
| Machinery form — 4 steps, basic save | ✅ Done |
| Photo attachments on all 3 form types | ✅ Done |
| Form locking during review | ✅ Done |
| Submit → review → approve workflow (Building & Land) | ✅ Done |
| Multi-tier approval: Tax Mapper → Municipal → LAOO → Provincial | ✅ Done |
| Field-specific comments with threads and resolution | ✅ Done |
| Return for revision with comment enforcement | ✅ Done |
| Full audit trail per form | ✅ Done |
| Tax Declaration view for Building and Land | ✅ Done |
| Previous TD auto-cancelled on new approval | ✅ Done |
| SMV tables — Land (all 10 municipalities) | ✅ Done |
| SMV tables — Building | ✅ Done |
| Building reference tables (types, deductions, depreciation) | ✅ Done |
| Print preview and print-only layout for all 3 form types | ✅ Done |
| Signature upload and management (per user) | ✅ Done |
| Signature path stored on record at Provincial approval | ✅ Done |
| Dashboard with form counts and status filters | ✅ Done |
| Review queue with multi-tier status visibility | ✅ Done |

### Phase 1 — Not Yet Built or Incomplete

| Feature | Status |
|---|---|
| Machinery submit → review → approve workflow | ❌ Missing |
| Signature image rendered on printed/PDF document | ⏸ Paused |
| TD number auto-generation per municipality | ❌ Missing |
| SMV table for Machinery | ❌ Missing |
| Letter generation — Cancellation of Real Property Tax | ❌ Not built |
| Letter generation — RPFAAS search & validate | ❌ Not built |
| In-app or email notifications (form returned, approved) | ❌ Not built |

---

## 15. GLOSSARY

| Term | Definition |
|---|---|
| **FAAS** | Field Appraisal and Assessment Sheet — official document for real property assessment |
| **RPFAAS** | Real Property Field Appraisal and Assessment Sheet (full system name) |
| **Tax Declaration (TD)** | Official document issued after FAAS approval declaring the assessed value |
| **LAOO** | Local Assessment Operations Officer — reviews and approves FAAS forms |
| **APA** | Assistant Provincial Assessor |
| **PA** | Provincial Assessor |
| **MTM** | Municipal Tax Mapper |
| **SMV** | Schedule of Market Values — reference unit values for land and buildings |
| **ARP No.** | Assessment Roll Property Number — unique identifier per property |
| **PIN** | Property Identification Number |
| **Draft** | A form being filled that has not yet been submitted |
| **Form Lock** | A temporary lock that prevents concurrent edits while a form is under review |
| **LGU** | Local Government Unit |
| **MPAOMIS** | Mountain Province Assessor's Office Management Information System |

---

*This document should be updated whenever major features are added, workflows change, or new roles are introduced.*
