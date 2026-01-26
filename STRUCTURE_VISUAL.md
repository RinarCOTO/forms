# RPFAAS Forms - Visual Structure

```
📁 app/rpfaas/
│
├── 📄 page.tsx                          ← Main Dashboard (Form Selector)
├── 📄 layout.tsx                        ← Shared Layout
├── 📄 README.md                         ← Documentation
│
├── 📁 building-structure/               🏢 Building & Structure Forms
│   ├── 📄 page.tsx                      → Redirects to /fill
│   ├── 📁 view/
│   │   └── 📄 page.tsx                  🖨️ View/Print Completed Form
│   └── 📁 fill/                         ✏️ Multi-Step Form Flow
│       ├── 📄 page.tsx                  [Step 1] Basic Info
│       ├── 📁 step-2/
│       │   └── 📄 page.tsx              [Step 2] Owner & Property
│       ├── 📁 step-3/
│       │   └── 📄 page.tsx              [Step 3] Structural Materials
│       ├── 📁 step-4/
│       │   └── 📄 page.tsx              [Step 4] Additional Items
│       ├── 📁 step-5/
│       │   └── 📄 page.tsx              [Step 5] Assessment
│       └── 📁 preview/
│           └── 📄 page.tsx              👁️ Preview Before Submit
│
├── 📁 land-improvements/                🏞️ Land & Other Improvements
│   ├── 📄 page.tsx                      → Redirects to /view
│   ├── 📁 view/
│   │   └── 📄 page.tsx                  🖨️ View/Print Form
│   └── 📁 fill/                         (To be implemented)
│       └── 📄 page.tsx
│
└── 📁 machinery/                        ⚙️ Machinery Forms (Coming Soon)
    └── 📄 page.tsx                      → Redirects to /rpfaas


═══════════════════════════════════════════════════════════════════

🔗 URL ROUTING MAP

┌─────────────────────────────────────────┬──────────────────────────────┐
│ URL                                     │ Purpose                      │
├─────────────────────────────────────────┼──────────────────────────────┤
│ /rpfaas                                 │ 🏠 Main Dashboard            │
│ /rpfaas/building-structure              │ → Redirect to fill           │
│ /rpfaas/building-structure/fill         │ ✏️  Step 1: Start Form       │
│ /rpfaas/building-structure/fill/step-2  │ ✏️  Step 2: Owner Info       │
│ /rpfaas/building-structure/fill/step-3  │ ✏️  Step 3: Materials        │
│ /rpfaas/building-structure/fill/step-4  │ ✏️  Step 4: Add. Items       │
│ /rpfaas/building-structure/fill/step-5  │ ✏️  Step 5: Assessment       │
│ /rpfaas/building-structure/fill/preview │ 👁️  Preview Form             │
│ /rpfaas/building-structure/view         │ 🖨️  View/Print               │
│ /rpfaas/land-improvements/view          │ 🖨️  View Land Form           │
│ /rpfaas/machinery                       │ 🚧 Coming Soon               │
└─────────────────────────────────────────┴──────────────────────────────┘

═══════════════════════════════════════════════════════════════════

📊 USER FLOW

1️⃣  User visits /rpfaas
    ↓
    Sees dashboard with 3 form types:
    • Building/Structure 🏢
    • Land/Improvements 🏞️
    • Machinery ⚙️

2️⃣  User selects "Building & Structure" → "Fill Form"
    ↓
    /rpfaas/building-structure/fill

3️⃣  User completes Step 1 → Clicks "Next"
    ↓
    /rpfaas/building-structure/fill/step-2

4️⃣  User progresses through steps 2, 3, 4, 5
    ↓
    Each step has "Previous" and "Next" buttons

5️⃣  After Step 5 → Clicks "Preview"
    ↓
    /rpfaas/building-structure/fill/preview

6️⃣  User reviews preview → Clicks "Print"
    ↓
    Browser print dialog opens

7️⃣  User can also navigate to "View" directly
    ↓
    /rpfaas/building-structure/view

═══════════════════════════════════════════════════════════════════

🎯 BENEFITS

✅ Scalable
   • Add new forms by creating new folder
   • Each form type is independent
   • No naming conflicts

✅ Maintainable
   • Clear, consistent structure
   • Easy to find files
   • Self-documenting URLs

✅ User-Friendly
   • Predictable navigation
   • Breadcrumbs show location
   • Clear URL paths

✅ Developer-Friendly
   • Easy to onboard new devs
   • Pattern is repeatable
   • Documentation included

═══════════════════════════════════════════════════════════════════

📝 PATTERN FOR NEW FORMS

When adding a new RPFAAS form (e.g., "tax-declaration"):

app/rpfaas/tax-declaration/
├── page.tsx              → Redirect handler
├── view/
│   └── page.tsx          → Display component
└── fill/
    ├── page.tsx          → Step 1
    ├── step-2/
    │   └── page.tsx      → Step 2
    └── preview/
        └── page.tsx      → Preview

Then update:
• /app/rpfaas/page.tsx (add to dashboard)
• /components/app-sidebar.tsx (add link)
• /app/components/forms/RPFAAS/ (create display component)

═══════════════════════════════════════════════════════════════════

🚀 FUTURE ENHANCEMENTS

• Add form state management (Zustand/Context)
• Add validation (Zod + React Hook Form)
• Add draft save/load
• Add PDF export
• Add form submission API
• Add user authentication
• Add form history
• Add form templates

═══════════════════════════════════════════════════════════════════
