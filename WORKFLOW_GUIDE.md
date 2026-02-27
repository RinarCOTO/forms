# RPFAAS System — Workflow Guide
*What was built, how it works, and how to use it.*

---

## What Is This System?

This is a digital system for the **Real Property Field Appraisal and Assessment Sheet (RPFAAS)** used by Philippine Local Government Units (LGUs). It replaces paper-based property assessment with an online workflow where:

- **Tax Mappers** fill out property forms
- **LAOO (Local Assessment Operations Officers)** review those forms
- **Provincial Assessors / APA** sign off on the final Tax Declaration

---

## Who Are the Users?

| Role | What They Do |
|---|---|
| **Tax Mapper** | Fills out FAAS forms for properties in their municipality |
| **Municipal Tax Mapper** | Same as Tax Mapper + can sign FAAS and Tax Declarations |
| **LAOO** | Reviews submitted forms, leaves comments, approves or returns them |
| **Assistant Provincial Assessor (APA)** | Signs Tax Declarations |
| **Provincial Assessor (PA)** | Signs Tax Declarations |
| **Accountant** | Views accounting data only |
| **Admin** | Manages the system (all access except role management) |
| **Super Admin** | Full access including user and role management |

---

## The Workflow (Step by Step)

Think of this like a paper trail that goes through different desks:

```
1. Tax Mapper fills the FAAS form (6 steps)
         ↓
2. Tax Mapper clicks "Submit for Review"
         ↓
3. Form appears in the LAOO Review Queue
         ↓
4. LAOO opens the form, reads it, leaves comments if needed
         ↓
   ┌─────────────────────────────┐
   │ LAOO decides:               │
   │  • Return → goes back to    │
   │    Tax Mapper with comments │
   │  • Approve → moves forward  │
   └─────────────────────────────┘
         ↓ (if approved)
5. Tax Declaration form is unlocked
         ↓
6. Tax Mapper fills in the Tax Declaration
         ↓
7. PA / APA / Municipal Tax Mapper signs it
         ↓
8. Form is finalized ✓
```

---

## What Was Built (This Session)

### 1. Submit for Review Button
**Where:** The preview page of any FAAS form (Building & Structure)

**What it does:**
- When the Tax Mapper is done filling all 6 steps, they go to the Preview page
- They click **"Submit for Review"**
- The system saves the form and changes its status from `draft` → `submitted`
- The form is now locked — the Tax Mapper cannot edit it until LAOO returns it

**Status labels you'll see:**
- 🟡 **Submitted** — waiting for LAOO to pick it up
- 🔵 **Under Review** — a LAOO has opened it
- 🟠 **Returned** — LAOO sent it back with comments
- 🟢 **Approved** — LAOO approved it

---

### 2. LAOO Review Queue (`/review-queue`)
**Who sees it:** LAOO, APA, PA, Admin, Super Admin

**What it shows:**
- A table of all forms that have been submitted or are currently being reviewed
- Columns: Form number, type, owner name, municipality, barangay, submission date, status
- Filter by: Status, Form Type (Building / Land), Municipality

**What LAOO can do from the queue:**
- Click **"Start Review"** → claims the form and marks it as "Under Review"
- Click **"Continue"** → reopens a form already being reviewed
- Use the **⋯ menu** → quick Approve or Return actions with a comment box

---

### 3. Review Detail Page (`/review-queue/[id]`)
**What it shows:**
- Full form data displayed in a clean read-only layout (Owner, Location, Building Details, Assessment)
- A **Comments panel** on the right side

**What LAOO can do here:**
- **Post comments** — choose which field has a problem, write the comment, optionally suggest the correct value
- **Start Review** — claims the form (if it's still "Submitted")
- **Return for Revision** — sends it back to the Tax Mapper (requires at least one comment)
- **Approve** — marks the form as approved (will unlock Tax Declaration in a future update)

---

### 4. User Management — New Roles Added
**Where:** `/manage-users` (Super Admin only)

New roles now appear in the "Add New User" dropdown:
- LAOO (Local Assessment Operations Officer)
- Assistant Provincial Assessor
- Provincial Assessor

When creating a LAOO user, two extra fields appear:
- **Municipality** (required) — which municipality's forms they will see
- **LAOO Level** (I, II, III, or IV) — informational only, all levels have the same permissions

---

### 5. Permissions System
Each role has specific permissions. Key ones:

| Permission | Who Has It |
|---|---|
| `forms.submit` | Tax Mapper, Municipal Tax Mapper, Admin, Super Admin |
| `review.laoo` | LAOO (can open, comment, return, approve forms) |
| `review.sign` | Municipal Tax Mapper, APA, PA (can sign Tax Declarations) |

---

## The Database Tables

These tables were created to support the workflow:

| Table | Purpose |
|---|---|
| `form_comments` | Stores LAOO comments on specific form fields |
| `form_attachments` | Documents attached by LAOO or Tax Mapper |
| `tax_declarations` | Created automatically when a form is approved |
| `form_review_history` | A permanent log of every status change (who did what, when) |

---

## What's Still To Be Built

| Step | What It Is |
|---|---|
| **Step 5** | Tax Mapper sees LAOO comments on their form and can reply or dispute |
| **Step 6** | Tax Declaration form becomes fillable after LAOO approves |
| **Step 7** | PA / APA / Municipal Tax Mapper signature queue |
| **Land Forms** | Same submit/review workflow for Land & Other Improvements forms |

---

## Common Questions

**Q: What happens if LAOO returns a form?**
The Tax Mapper will see the form status as "Returned" on their dashboard. The form becomes editable again. They can read the LAOO's comments, make corrections, and click "Resubmit for Review."

**Q: Can LAOO edit the form values directly?**
No. LAOO can only leave comments and suggested values. This keeps the process transparent — the Tax Mapper makes all changes.

**Q: What if there are no comments when LAOO tries to return a form?**
The system will not allow it. At least one comment must be posted before returning a form, so the Tax Mapper knows what to fix.

**Q: Who can see the review queue?**
LAOO, APA, PA, Admin, and Super Admin. A LAOO assigned to a specific municipality will only see forms from that municipality.

**Q: What is the form_review_history table for?**
It's an audit log — every time a form's status changes (submitted, returned, approved, etc.), a permanent record is saved showing who did it and when. This cannot be deleted or modified.

---

## Navigation (Sidebar Menu)

| Section | Visible To | Destination |
|---|---|---|
| Land Assessor | Anyone who can view FAAS forms | Building / Land form dashboards |
| Provincial Review | LAOO only | `/review-queue` |
| Signatures | MTM, APA, PA | `/signature-queue` (coming soon) |
| Accountant | Accountant role | Accounting views |
| Super Admin | Super Admin only | User and role management |
