# Standard Operating Procedure (SOP)
## RPFAAS — Real Property Field Appraisal and Assessment Sheet System
**Document Version:** 1.0
**Date:** March 6, 2026
**Repository:** RinarCOTO/forms

---

## 1. PURPOSE

This document describes the standard operating procedures for the **RPFAAS Digital Forms System** — a web-based platform used by Philippine Local Government Units (LGUs) to digitize and manage the Real Property Field Appraisal and Assessment Sheet (FAAS) workflow. It covers the system's purpose, user roles, step-by-step workflows, technical architecture, and planned future improvements.

---

## 2. SCOPE

This SOP applies to all personnel involved in property assessment and appraisal within the LGU, including:

- Tax Mappers / Municipal Tax Mappers
- Local Assessment Operations Officers (LAOO)
- Assistant Provincial Assessors (APA)
- Provincial Assessors (PA)
- System Administrators and Super Administrators

---

## 3. SYSTEM OVERVIEW

The RPFAAS system replaces manual, paper-based property assessment with a structured digital workflow. It enables:

- Online creation, filling, and submission of FAAS forms
- Multi-step guided form filling with per-step auto-save
- A review and approval pipeline between Tax Mappers and LAOOs
- Schedule of Market Values (SMV) lookup for land and building assessments
- User role management and permission control
- Audit trail for every status change

### 3.1 Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| UI Components | shadcn/ui + Tailwind CSS |
| Deployment | Vercel |
| Storage | Supabase Storage (attachments/photos) |

---

## 4. USER ROLES AND RESPONSIBILITIES

| Role | Access Level | Primary Responsibilities |
|---|---|---|
| **Tax Mapper** | Municipality-scoped | Fill FAAS forms, submit for review, respond to returned forms |
| **Municipal Tax Mapper** | Municipality-scoped | Same as Tax Mapper + can sign Tax Declarations |
| **LAOO** | Municipality-scoped | Review submitted forms, post comments, approve or return forms |
| **Assistant Provincial Assessor (APA)** | Province-wide | Sign Tax Declarations |
| **Provincial Assessor (PA)** | Province-wide | Sign Tax Declarations |
| **Accountant** | Read-only | View accounting data and assessments |
| **Admin** | System-wide | Full access to all forms; cannot manage roles |
| **Super Admin** | Full access | All of the above + user management + role/permission matrix |

---

## 5. FORM TYPES

### 5.1 Building & Other Structures (FAAS — Building)
A 7-step form covering:
1. Owner / Location Information
2. Building Description
3. Structural Details
4. Additional Building Features
5. Roof & Floor Details
6. Assessment Computation
7. Preview & Submit

### 5.2 Land & Other Improvements (FAAS — Land)
A 4-step form covering:
1. Owner / Location Information
2. Land Classification & Area
3. Land Improvements (trees, crops, agricultural improvements)
4. Assessment Computation & Preview

### 5.3 Schedule of Market Values (SMV)
Reference tables used during assessment computation. Organized per municipality and covers:
- **Commercial lots** — by road type and classification (C-1, C-2, etc.)
- **Residential lots** — by location and barangay zone (R-1 through R-4)
- **Agricultural land** — by land type and class (Riceland, Fishpond, Rootcrop, Vegetable, Fruit, Pasture, Cogon, Pinetree) with 1st–4th class values
- **Agricultural improvements** — by tree/crop type and class (1st–3rd), including Avocado, Banana, Calamansi, Coconut, Coffee/Cacao, Mango, Orange

Current municipalities with SMV data:
`Barlig`, `Bauko`, `Besao`, `Bontoc`, `Natonin`, `Paracelis`, `Sabangan`, `Sadanga`, `Sagada`, `Tadian`

---

## 6. STANDARD WORKFLOW

### 6.1 Creating and Submitting a Form (Tax Mapper)

```
Step 1 → Fill Owner & Location details
         (Auto-save to database on each step)
         ↓
Step 2–6/4 → Fill all form steps
         ↓
Preview Page → Review entire form
         ↓
"Submit for Review" → Status changes: draft → submitted
         ↓
Form is LOCKED — no edits until LAOO reviews it
```

**Key Rules:**
- A form can be saved as a **Draft** at any step and resumed later.
- Once submitted, the Tax Mapper cannot make edits unless the LAOO returns the form.
- Each step is saved to the database independently to prevent data loss.

### 6.2 Reviewing a Form (LAOO)

```
LAOO opens Review Queue (/review-queue)
         ↓
Sees all submitted / under-review forms for their municipality
         ↓
Clicks "Start Review" → Status changes: submitted → under_review
         ↓
Opens Review Detail Page (/review-queue/[id])
         ↓
Reviews form data (read-only)
         ↓
   ┌──────────────────────────────────┐
   │  LAOO Decision:                  │
   │  • Return for Revision →         │
   │    Must post at least 1 comment  │
   │    Status: under_review → returned│
   │                                  │
   │  • Approve →                     │
   │    Status: under_review → approved│
   │    Tax Declaration is unlocked   │
   └──────────────────────────────────┘
```

**Key Rules:**
- A LAOO can only review forms from their assigned municipality (unless municipality is NULL = province-wide access).
- Returning a form requires at least one comment explaining what needs to be corrected.
- LAOO cannot edit form values directly — only leave comments and suggested values.

### 6.3 Responding to a Returned Form (Tax Mapper)

```
Tax Mapper sees "Returned" status on their dashboard
         ↓
Opens form → Status: returned (editable again)
         ↓
Reads LAOO comments → Makes corrections
         ↓
"Resubmit for Review" → Status: returned → submitted
```

### 6.4 Form Status Flow

```
draft → submitted → under_review → approved
                             ↓
                         returned → submitted (loop)
```

| Status | Color | Meaning |
|---|---|---|
| `draft` | Gray | Being filled by Tax Mapper |
| `submitted` | Yellow | Waiting for LAOO to pick up |
| `under_review` | Blue | LAOO is actively reviewing |
| `returned` | Red | Sent back to Tax Mapper with comments |
| `approved` | Green | LAOO approved; Tax Declaration unlocked |

---

## 7. USER MANAGEMENT

### 7.1 Creating a New User (Super Admin)

1. Navigate to `/manage-users`
2. Click **"Add New User"**
3. Fill in: Full Name, Email, Password, Role, Municipality (for LAOO/MTM)
4. For LAOO roles: also set LAOO Level (I–IV)
5. Click **"Create User"**

### 7.2 Managing Permissions (Super Admin)

1. Navigate to `/manage-roles`
2. View the permission matrix by role
3. Toggle permissions on/off per role
4. Changes take effect immediately

**Key Permissions:**

| Permission | Controls |
|---|---|
| `forms.submit` | Ability to submit forms for review |
| `review.laoo` | Access to Review Queue and review actions |
| `review.sign` | Ability to sign Tax Declarations |
| `forms.view` | Viewing FAAS form data |
| `admin.users` | User management |

---

## 8. SMV DATA MANAGEMENT

The Schedule of Market Values (SMV) is stored in:
```
app/smv/land-other-improvements/data.ts
app/smv/building-other-structures/data.ts
```

Each municipality entry in `data.ts` must contain:
```typescript
{
  commercial: SmvRow[],
  residential: SmvRow[],
  agricultural: SmvRow[],
  agriculturalLand: AgriculturalLandRow[],
  agriculturalImprovementRow: agriculturalImprovementRow[]
}
```

**To add or update SMV values:**
1. Open the relevant `data.ts` file
2. Locate the municipality key (e.g., `bontoc`, `sagada`)
3. Add/edit rows following the existing data structure
4. Empty arrays `[]` are valid for municipalities with no data yet
5. Values should be formatted as Philippine Peso strings: `"₱ 63,480.00"` or use `"-"` for no value

---

## 9. DATABASE TABLES

| Table | Purpose |
|---|---|
| `building_structures` | All Building & Other Structure FAAS records |
| `land_improvements` | All Land & Other Improvements FAAS records |
| `users` | User accounts with roles and municipality |
| `form_comments` | LAOO comments on specific form fields |
| `form_attachments` | Supporting documents uploaded by any party |
| `tax_declarations` | Auto-created when a FAAS is approved |
| `form_review_history` | Immutable audit log of every status change |
| `role_permissions` | Configurable permission matrix per role |

---

## 10. KEY API ROUTES

| Method | Route | Purpose |
|---|---|---|
| `GET/POST` | `/api/faas/building-structures` | List all / create new building FAAS |
| `GET/PUT/DELETE` | `/api/faas/building-structures/[id]` | Get, update, or delete a record |
| `POST` | `/api/faas/building-structures/[id]/submit` | Submit for review (draft → submitted) |
| `POST` | `/api/faas/building-structures/[id]/review` | LAOO claim / return / approve |
| `GET/POST` | `/api/faas/building-structures/[id]/comments` | View and add comments |
| `GET` | `/api/review-queue` | All submitted/under-review forms for LAOO |
| `GET` | `/api/auth/user` | Current session user + role |
| `GET` | `/api/users/by-role` | Fetch users filtered by role |
| `GET/PATCH` | `/api/role-permissions` | Read and update permission matrix |

---

## 11. DEVELOPMENT SETUP

```bash
# 1. Clone the repository
git clone https://github.com/RinarCOTO/forms.git
cd forms

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create .env.local with:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 4. Set up the database
# Run CREATE_COMPLETE_DATABASE.sql in Supabase SQL Editor

# 5. Start the development server
npm run dev
# App runs at http://localhost:3000
```

---

## 12. CURRENT SYSTEM STATUS

### ✅ Completed Features
- [x] User authentication (login, signup, reset password)
- [x] Role-based access control with configurable permissions
- [x] User management (Super Admin)
- [x] Building & Other Structures form (7 steps with per-step save)
- [x] Land & Other Improvements form (4 steps with per-step save)
- [x] Submit for Review workflow (Tax Mapper → LAOO)
- [x] LAOO Review Queue with municipality filtering
- [x] Review Detail page with comment system
- [x] Approve / Return workflow with comment enforcement
- [x] Dashboard per form type with status badges and pagination
- [x] Municipality and Barangay filters on dashboards
- [x] Print Preview for all form types
- [x] SMV reference tables for all 10 municipalities (commercial, residential, agricultural land, agricultural improvements)
- [x] Audit trail (form_review_history)
- [x] Municipal Assessor display on dashboards

---

## 13. FUTURE IMPROVEMENTS

### 13.1 Short-Term (Next Sprint)

| Feature | Description | Priority |
|---|---|---|
| **Tax Mapper Comment View** | Tax Mapper can see LAOO comments on their returned form and reply or dispute | 🔴 High |
| **Tax Declaration Form** | After LAOO approval, unlock and fill the Tax Declaration form | 🔴 High |
| **Resubmit Button** | "Resubmit for Review" button on returned forms | 🔴 High |
| **Signature Queue** | PA / APA / Municipal Tax Mapper queue to sign finalized Tax Declarations | 🟡 Medium |
| **Machinery Form** | Third FAAS form type: Machinery & Equipment | 🟡 Medium |

### 13.2 Medium-Term

| Feature | Description | Priority |
|---|---|---|
| **SMV for All Municipalities** | Complete SMV data entry for all Mountain Province municipalities | 🟡 Medium |
| **PDF Generation** | Generate print-ready PDF of completed FAAS and Tax Declaration forms | 🟡 Medium |
| **Email Notifications** | Notify Tax Mapper via email when form is returned or approved | 🟡 Medium |
| **Batch Review** | Allow LAOO to approve/return multiple forms at once | 🟠 Low |
| **Dashboard Analytics** | Stats and charts on dashboard: total submissions, approval rates, per-municipality breakdowns | 🟠 Low |
| **Form Version History** | Track changes between resubmissions side-by-side | 🟠 Low |

### 13.3 Long-Term

| Feature | Description | Priority |
|---|---|---|
| **Mobile App / PWA** | Progressive Web App for field use by Tax Mappers on mobile devices | 🟠 Low |
| **GIS Map Integration** | Parcel map with property pins; link forms to map coordinates | 🟠 Low |
| **Offline Mode** | Allow Tax Mappers to fill forms without internet and sync later | 🟠 Low |
| **Bulk Import** | Import existing paper-based FAAS records via CSV/Excel upload | 🟠 Low |
| **Automated SMV Lookup** | Auto-fill market values during form fill-out based on selected classification | 🟠 Low |
| **Reporting Module** | Generate summary reports per municipality/barangay for provincial use | 🟠 Low |
| **Integration with RPTIS** | Link with the Real Property Tax Information System for automatic tax computation | 🟠 Low |

---

## 14. GLOSSARY

| Term | Definition |
|---|---|
| **FAAS** | Field Appraisal and Assessment Sheet — the official document used to assess real property |
| **RPFAAS** | Real Property Field Appraisal and Assessment Sheet (full name of the system) |
| **Tax Declaration** | Official document issued after FAAS approval declaring the assessed value of a property |
| **LAOO** | Local Assessment Operations Officer — reviews and approves FAAS forms |
| **APA** | Assistant Provincial Assessor |
| **PA** | Provincial Assessor |
| **MTM** | Municipal Tax Mapper |
| **SMV** | Schedule of Market Values — reference table for land and building unit values |
| **RLS** | Row Level Security — Supabase feature that restricts data access per user |
| **Draft** | A form that is still being filled and has not been submitted |
| **LGU** | Local Government Unit |

---

*This document should be updated whenever major features are added, workflows change, or new roles are introduced.*
