# 📋 Save Functionality Implementation Checklist

Use this checklist when adding save functionality to each form step.

## 🎯 Form: [Form Name] - Step [X]

**File:** `_________________________________`

**Date Started:** `__________` **Date Completed:** `__________`

---

## ✅ Implementation Steps

### 1. Import Required Dependencies
- [ ] Import `useSaveForm` hook from `@/hooks/useSaveForm`
- [ ] Import `SaveButton` and `SaveStatus` from `@/components/SaveButton`
- [ ] Verify all imports are working (no red underlines)

### 2. Initialize Save Hook
- [ ] Add `useSaveForm` hook with correct `formType`
- [ ] Set correct `step` number
- [ ] Destructure all needed values: `isSaving`, `lastSaved`, `saveDraft`, `saveToDatabaseAsDraft`, `loadDraft`, `saveError`

### 3. Create Data Collection Function
- [ ] Create `collectFormData()` function
- [ ] Include ALL form fields in the returned object
- [ ] Use consistent field names (camelCase recommended)
- [ ] Test that function returns correct data structure

### 4. Add Save Handlers
- [ ] Create `handleSaveDraftLocal()` function
- [ ] Create `handleSaveDraftDatabase()` async function
- [ ] Verify both call `collectFormData()`
- [ ] Test that handlers don't cause errors

### 5. Implement Draft Loading
- [ ] Add `useEffect` with empty dependency array
- [ ] Call `loadDraft()` inside useEffect
- [ ] Check if draft exists before using
- [ ] Set ALL state variables from draft data
- [ ] Add console.log for debugging ("✅ Draft loaded")
- [ ] Test that draft loads correctly on page refresh

### 6. Update UI - Header
- [ ] Locate form header section
- [ ] Add `<SaveStatus>` component
- [ ] Pass `lastSaved`, `isSaving`, and `saveError` props
- [ ] Position appropriately (usually top-right)
- [ ] Verify styling matches your design

### 7. Update UI - Footer
- [ ] Locate form footer/actions section
- [ ] Add `<SaveButton>` component for local save
- [ ] Connect to `handleSaveDraftLocal`
- [ ] Add "Save to Cloud" button (optional but recommended)
- [ ] Connect to `handleSaveDraftDatabase`
- [ ] Pass `isSaving` to disable during save
- [ ] Ensure button layout looks good
- [ ] Keep existing navigation buttons (Previous/Next)

### 8. Testing - Local Save
- [ ] Fill in some form fields
- [ ] Click "Save Draft" button
- [ ] Verify "Saved just now" appears
- [ ] Check browser console for success message
- [ ] Open DevTools → Application → Local Storage
- [ ] Verify data is stored with correct key
- [ ] Refresh page
- [ ] Verify fields auto-populate with saved data

### 9. Testing - Database Save
- [ ] Fill in some form fields
- [ ] Click "Save to Cloud" button
- [ ] Verify loading animation appears
- [ ] Verify "Saved just now" appears after completion
- [ ] Check browser console for success message
- [ ] Check database for new record
- [ ] Verify `status` field is 'draft'
- [ ] Test updating: change data and save again
- [ ] Verify existing record is updated (not duplicated)

### 10. Testing - Error Handling
- [ ] Test with invalid data (if validation exists)
- [ ] Test with network disconnected (for cloud save)
- [ ] Verify error message displays
- [ ] Verify UI recovers gracefully from errors
- [ ] Test clearing error by successful save

### 11. Code Quality
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Code follows existing patterns
- [ ] Comments added where needed
- [ ] Removed debug console.logs (except success messages)
- [ ] Proper indentation and formatting

### 12. Documentation
- [ ] Update this checklist with completion date
- [ ] Note any issues encountered
- [ ] Document any custom modifications

---

## 📝 Notes & Issues

**Issues Encountered:**
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________

**Custom Modifications:**
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________

**Time Taken:**
_______________________________________________________________________

---

## 🎯 Quick Reference Code Snippets

### Minimal Implementation:

```tsx
// 1. Import
import { useSaveForm } from "@/hooks/useSaveForm";
import { SaveButton, SaveStatus } from "@/components/SaveButton";

export default function FormStep() {
  // 2. Your existing state
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  
  // 3. Initialize hook
  const { isSaving, lastSaved, saveDraft, saveToDatabaseAsDraft, loadDraft, saveError } = 
    useSaveForm({ formType: 'building-structure', step: 1 });
  
  // 4. Data collection
  const collectFormData = () => ({ field1, field2 });
  
  // 5. Save handlers
  const handleSaveDraftLocal = () => saveDraft(collectFormData());
  const handleSaveDraftDatabase = async () => await saveToDatabaseAsDraft(collectFormData());
  
  // 6. Load draft
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      if (draft.field1) setField1(draft.field1);
      if (draft.field2) setField2(draft.field2);
      console.log('✅ Draft loaded');
    }
  }, []);
  
  return (
    <form>
      {/* 7. Add to header */}
      <header>
        <h1>Title</h1>
        <SaveStatus lastSaved={lastSaved} isSaving={isSaving} error={saveError} />
      </header>
      
      {/* Your form fields */}
      
      {/* 8. Add to footer */}
      <footer>
        <SaveButton onSave={handleSaveDraftLocal} isSaving={isSaving} lastSaved={lastSaved} showLastSaved={false} />
        <Button onClick={handleSaveDraftDatabase} disabled={isSaving}>Save to Cloud</Button>
        <Button onClick={() => router.push("/next")}>Next</Button>
      </footer>
    </form>
  );
}
```

---

## 🚀 After Completion

- [ ] Mark this form as complete in main tracking document
- [ ] Move to next form
- [ ] Copy this checklist for next form
- [ ] Update progress in README

---

**✅ COMPLETED:** `______` / 12 steps

**Status:** 
- [ ] Not Started
- [ ] In Progress
- [ ] Testing
- [ ] Complete

**Reviewed By:** `________________` **Date:** `__________`
