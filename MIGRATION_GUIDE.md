# Migration Guide: Old Structure → New RPFAAS Structure

## Overview

This guide documents the migration from the old file structure to the new, scalable RPFAAS structure.

## What Changed?

### Old Structure (❌ Not Scalable)
```
app/
  building-other-structure/
    page.tsx
    fill/
      page.tsx
      page-1.tsx
      page-2.tsx
      page-3.tsx
      step-1/page.tsx
      step-2/page.tsx
      step-3/page.tsx
      step-4/page.tsx
      step-5/page.tsx
      preview-form/page.tsx
      building-structure-form-fill-page-2/page.tsx
      building-structure-form-fill-page-3/page.tsx
      sample-page-2/page.tsx
      _fill_backup_full_20260121/
  land-other-improvements/
    page.tsx
```

**Problems:**
- Inconsistent naming (step-1, page-1, page-2, etc.)
- Mixed purposes in same folder
- Hard to add new form types
- Backup folders in production code
- No clear grouping of related forms

### New Structure (✅ Scalable & Clean)
```
app/
  rpfaas/                          # All RPFAAS forms grouped
    page.tsx                       # Dashboard
    layout.tsx                     # Shared layout
    building-structure/
      page.tsx                     # Redirects to fill
      view/page.tsx                # View completed form
      fill/
        page.tsx                   # Step 1
        step-2/page.tsx           # Step 2
        step-3/page.tsx           # Step 3
        step-4/page.tsx           # Step 4
        step-5/page.tsx           # Step 5
        preview/page.tsx          # Preview
    land-improvements/
      page.tsx
      view/page.tsx
      fill/page.tsx                # To be implemented
    machinery/
      page.tsx                     # Coming soon
```

**Benefits:**
- ✅ Consistent naming pattern
- ✅ Clear separation by form type
- ✅ Easy to add new forms
- ✅ Better URL structure
- ✅ Scalable to 10+ form types

## URL Mapping

| Old URL | New URL | Status |
|---------|---------|--------|
| `/building-other-structure` | `/rpfaas/building-structure/view` | ✅ Migrated |
| `/building-other-structure/fill` | `/rpfaas/building-structure/fill` | ✅ Migrated |
| `/building-other-structure/fill/step-1` | `/rpfaas/building-structure/fill` | ✅ Merged into main |
| `/building-other-structure/fill/step-2` | `/rpfaas/building-structure/fill/step-2` | ✅ Migrated |
| `/building-other-structure/fill/step-3` | `/rpfaas/building-structure/fill/step-3` | ✅ Migrated |
| `/building-other-structure/fill/step-4` | `/rpfaas/building-structure/fill/step-4` | ✅ Migrated |
| `/building-other-structure/fill/step-5` | `/rpfaas/building-structure/fill/step-5` | ✅ Migrated |
| `/building-other-structure/fill/preview-form` | `/rpfaas/building-structure/fill/preview` | ✅ Migrated |
| `/land-other-improvements` | `/rpfaas/land-improvements/view` | ✅ Migrated |

## Files Migrated

### New Files Created
- ✅ `/app/rpfaas/page.tsx` - Main dashboard
- ✅ `/app/rpfaas/layout.tsx` - Shared layout
- ✅ `/app/rpfaas/building-structure/page.tsx` - Redirect handler
- ✅ `/app/rpfaas/building-structure/view/page.tsx` - View form
- ✅ `/app/rpfaas/building-structure/fill/page.tsx` - Step 1 (from step-1)
- ✅ `/app/rpfaas/building-structure/fill/step-2/page.tsx` - Copied & updated
- ✅ `/app/rpfaas/building-structure/fill/step-3/page.tsx` - Copied & updated
- ✅ `/app/rpfaas/building-structure/fill/step-4/page.tsx` - Copied & updated
- ✅ `/app/rpfaas/building-structure/fill/step-5/page.tsx` - Copied & updated
- ✅ `/app/rpfaas/building-structure/fill/preview/page.tsx` - Copied & updated
- ✅ `/app/rpfaas/land-improvements/page.tsx` - Redirect handler
- ✅ `/app/rpfaas/land-improvements/view/page.tsx` - View form
- ✅ `/app/rpfaas/machinery/page.tsx` - Coming soon placeholder
- ✅ `/app/rpfaas/README.md` - Documentation

### Files Updated
- ✅ `/components/app-sidebar.tsx` - Updated navigation links

### Old Files to Archive/Delete
The following directories can be archived or deleted after testing:
- ⚠️ `/app/building-other-structure/` (entire directory)
- ⚠️ `/app/land-other-improvements/page.tsx` (can redirect to new location)

## Testing Checklist

Before removing old files, verify:

- [ ] RPFAAS dashboard loads at `/rpfaas`
- [ ] Building structure form navigation works (all steps)
- [ ] Preview page loads and prints correctly
- [ ] View page renders form correctly
- [ ] Land improvements view page loads
- [ ] Sidebar navigation uses new paths
- [ ] All router.push() calls use new paths
- [ ] All Link hrefs use new paths
- [ ] Form state persists between steps
- [ ] Data loads correctly in preview

## Cleanup Steps

After verifying everything works:

1. **Backup old structure:**
   ```bash
   mv app/building-other-structure app/_archived_building-other-structure_20260126
   ```

2. **Update any remaining references:**
   ```bash
   # Search for old paths
   grep -r "building-other-structure" app/
   grep -r "land-other-improvements" app/
   ```

3. **Create redirects** (optional, for backward compatibility):
   Create `/app/building-other-structure/page.tsx`:
   ```tsx
   import { redirect } from "next/navigation";
   export default function Page() {
     redirect("/rpfaas/building-structure/view");
   }
   ```

## Future Additions

When adding new form types (e.g., Assessment Roll, Tax Declaration):

1. Create folder structure:
   ```
   app/rpfaas/[form-type]/
     page.tsx
     view/page.tsx
     fill/page.tsx
   ```

2. Add to dashboard in `/app/rpfaas/page.tsx`
3. Add to sidebar in `/components/app-sidebar.tsx`
4. Create form component in `/app/components/forms/RPFAAS/`

## Questions or Issues?

If you encounter any issues during migration:
1. Check the URL mapping table above
2. Verify all path replacements were applied
3. Check browser console for 404 errors
4. Ensure form state management is working
