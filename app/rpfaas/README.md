# RPFAAS Forms Structure

This directory contains all Real Property Field Appraisal & Assessment Sheet (RPFAAS) forms.

## Directory Structure

```
rpfaas/
├── page.tsx                           # Main RPFAAS dashboard/selector
├── layout.tsx                         # Shared layout for all RPFAAS forms
│
├── building-structure/                # Building & Structure forms
│   ├── page.tsx                       # Redirects to fill
│   ├── view/
│   │   └── page.tsx                   # View/print completed form
│   └── fill/
│       ├── page.tsx                   # Step 1: Basic Information
│       ├── step-2/
│       │   └── page.tsx               # Step 2: Owner & Property Details
│       ├── step-3/
│       │   └── page.tsx               # Step 3: Structural Materials
│       ├── step-4/
│       │   └── page.tsx               # Step 4: Additional Items
│       ├── step-5/
│       │   └── page.tsx               # Step 5: Assessment
│       └── preview/
│           └── page.tsx               # Preview before submission
│
├── land-improvements/                 # Land & Other Improvements forms
│   ├── page.tsx                       # Redirects to view/fill
│   ├── view/
│   │   └── page.tsx                   # View/print completed form
│   └── fill/                          # (To be implemented)
│       └── page.tsx
│
└── machinery/                         # Machinery forms (Coming soon)
    ├── page.tsx                       # Redirects to RPFAAS home
    └── fill/                          # (To be implemented)
        └── page.tsx
```

## URL Structure

- `/rpfaas` - Main dashboard to select form type
- `/rpfaas/building-structure/fill` - Start filling building form (Step 1)
- `/rpfaas/building-structure/fill/step-2` - Step 2 of building form
- `/rpfaas/building-structure/fill/preview` - Preview before submission
- `/rpfaas/building-structure/view` - View completed building form
- `/rpfaas/land-improvements/view` - View land improvements form
- `/rpfaas/machinery` - Machinery forms (redirects to dashboard)

## Benefits of This Structure

1. **Scalable**: Easy to add new form types (just add a new folder)
2. **Consistent**: All RPFAAS forms follow the same pattern
3. **Maintainable**: Clear separation between form types
4. **User-friendly**: Clean, predictable URLs
5. **Flexible**: Each form type can have different numbers of steps

## Adding a New Form Type

To add a new RPFAAS form type (e.g., "machinery"):

1. Create the directory structure:
   ```
   rpfaas/machinery/
   ├── page.tsx
   ├── view/
   │   └── page.tsx
   └── fill/
       ├── page.tsx
       └── step-2/
           └── page.tsx
   ```

2. Update `rpfaas/page.tsx` to include the new form in the dashboard

3. Update the sidebar in `/components/app-sidebar.tsx`

4. Create the form component in `/app/components/forms/RPFAAS/`

## Migration Notes

**Old Structure → New Structure**

- `/building-other-structure/fill` → `/rpfaas/building-structure/fill`
- `/building-other-structure/fill/step-1` → `/rpfaas/building-structure/fill` (now main page)
- `/building-other-structure/fill/step-2` → `/rpfaas/building-structure/fill/step-2`
- `/building-other-structure/fill/preview-form` → `/rpfaas/building-structure/fill/preview`
- `/building-other-structure` → `/rpfaas/building-structure/view`
- `/land-other-improvements` → `/rpfaas/land-improvements/view`

## Next Steps

1. ✅ Migrate building structure forms
2. ⏳ Implement land improvements fill flow
3. ⏳ Implement machinery forms
4. ⏳ Add form state management (Context/Zustand)
5. ⏳ Add form validation
6. ⏳ Add draft save/load functionality
