# Form Save Functionality - Implementation Guide

## 📋 Overview

This guide explains how to implement save functionality in your multi-step forms. The system provides:

- ✅ **Save Draft (Local)** - Saves to browser localStorage for quick drafts
- ✅ **Save to Cloud** - Saves to database for persistent storage
- ✅ **Auto-load** - Automatically loads saved drafts when reopening forms
- ✅ **Save Status** - Shows when last saved and saving status
- ✅ **Error Handling** - Displays errors if save fails

## 🎯 Quick Start

### 1. Add Save Button to Any Form Step

```tsx
import { useSaveForm } from "@/hooks/useSaveForm";
import { SaveButton, SaveStatus } from "@/components/SaveButton";

export default function YourFormStep() {
  // Your existing state
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  
  // Add the save hook
  const {
    isSaving,
    lastSaved,
    saveDraft,
    saveToDatabaseAsDraft,
    loadDraft,
    saveError,
  } = useSaveForm({
    formType: 'building-structure', // Your form type
    step: 1, // Current step number
  });

  // Function to collect all form data
  const collectFormData = () => {
    return {
      field1,
      field2,
      // ... all your form fields
    };
  };

  // Save handlers
  const handleSaveDraftLocal = () => {
    const formData = collectFormData();
    saveDraft(formData);
  };

  const handleSaveDraftDatabase = async () => {
    const formData = collectFormData();
    await saveToDatabaseAsDraft(formData);
  };

  // Load draft on mount
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
      {/* Show save status in header */}
      <header>
        <h1>Your Form Title</h1>
        <SaveStatus lastSaved={lastSaved} isSaving={isSaving} error={saveError} />
      </header>

      {/* Your form fields */}
      <input value={field1} onChange={(e) => setField1(e.target.value)} />
      
      {/* Footer with save buttons */}
      <footer>
        <SaveButton
          onSave={handleSaveDraftLocal}
          isSaving={isSaving}
          lastSaved={lastSaved}
          showLastSaved={false}
        />
        <Button onClick={handleSaveDraftDatabase}>
          Save to Cloud
        </Button>
        <Button onClick={() => router.push("/next-step")}>
          Next
        </Button>
      </footer>
    </form>
  );
}
```

## 📚 API Reference

### `useSaveForm` Hook

```tsx
const {
  isSaving,           // boolean - true when saving to database
  lastSaved,          // string | null - ISO timestamp of last save
  savedFormId,        // string | null - ID of saved form in database
  saveDraft,          // (data) => void - Save to localStorage
  saveToDatabaseAsDraft,    // (data) => Promise<void> - Save to DB as draft
  saveToDatabaseAsSubmitted, // (data) => Promise<void> - Final submission
  loadDraft,          // () => FormData | null - Load from localStorage
  clearCurrentDraft,  // () => void - Clear saved draft
  saveError,          // string | null - Error message if save failed
} = useSaveForm({
  formType: 'building-structure',  // Form type identifier
  step: 1,                         // Current step number
});
```

### `SaveButton` Component

```tsx
<SaveButton
  onSave={() => {}}           // Function to call when clicked
  isSaving={false}            // Show loading state
  lastSaved={null}            // Last saved timestamp
  variant="outline"           // Button variant (default, outline, etc.)
  className=""                // Additional classes
  showLastSaved={true}        // Show "Saved X minutes ago"
/>
```

### `SaveStatus` Component

```tsx
<SaveStatus
  lastSaved={lastSaved}      // Last saved timestamp
  isSaving={isSaving}        // Show loading state
  error={saveError}          // Error message to display
/>
```

## 🔧 Utility Functions

### Form Storage (`lib/formStorage.ts`)

```tsx
import {
  saveDraftToLocal,     // Save to localStorage
  loadDraftFromLocal,   // Load from localStorage
  getDraftMetadata,     // Get save metadata
  clearDraft,           // Clear saved draft
  saveFormToDatabase,   // Save to database (new record)
  updateFormInDatabase, // Update existing record
  loadFormFromDatabase, // Load from database
  formatLastSaved,      // Format timestamp ("5 minutes ago")
} from '@/lib/formStorage';
```

## 📝 Implementation Examples

### Example 1: Simple Form with Local Save Only

```tsx
const { saveDraft, loadDraft, lastSaved } = useSaveForm({
  formType: 'my-form',
  step: 1,
});

// Save to localStorage
const handleSave = () => {
  saveDraft({ field1: value1, field2: value2 });
};

// Load on mount
useEffect(() => {
  const draft = loadDraft();
  if (draft) {
    // Populate fields
  }
}, []);
```

### Example 2: Form with Database Persistence

```tsx
const {
  isSaving,
  saveToDatabaseAsDraft,
  saveToDatabaseAsSubmitted,
} = useSaveForm({
  formType: 'building-structure',
  step: 2,
});

// Save as draft
const handleSaveDraft = async () => {
  await saveToDatabaseAsDraft(collectFormData());
};

// Final submission
const handleSubmit = async (e) => {
  e.preventDefault();
  await saveToDatabaseAsSubmitted(collectFormData());
  router.push('/success');
};
```

### Example 3: Complex Multi-Step Form

```tsx
// Step 1
const step1Save = useSaveForm({ formType: 'building-structure', step: 1 });

// Step 2
const step2Save = useSaveForm({ formType: 'building-structure', step: 2 });

// Each step saves independently
// When moving to next step, save current step
const goToNextStep = async () => {
  await step1Save.saveToDatabaseAsDraft(collectFormData());
  router.push('/step-2');
};
```

## 🎨 UI Patterns

### Pattern 1: Save Button in Footer

```tsx
<div className="rpfaas-fill-footer border-t pt-4 mt-4">
  <div className="flex gap-2 justify-between">
    <div className="flex gap-2">
      <SaveButton onSave={handleSave} isSaving={isSaving} />
      <Button onClick={handleSaveToCloud}>Save to Cloud</Button>
    </div>
    <Button onClick={handleNext}>Next</Button>
  </div>
</div>
```

### Pattern 2: Save Status in Header

```tsx
<header className="flex items-center justify-between">
  <div>
    <h1>Form Title</h1>
    <p>Description</p>
  </div>
  <SaveStatus lastSaved={lastSaved} isSaving={isSaving} error={saveError} />
</header>
```

### Pattern 3: Auto-save Indicator

```tsx
{lastSaved && (
  <div className="text-xs text-green-600 flex items-center gap-1">
    <Check className="h-3 w-3" />
    Saved {formatLastSaved(lastSaved)}
  </div>
)}
```

## 🔄 Data Flow

### Local Save Flow
```
User fills form → Click "Save Draft" → Data saved to localStorage
→ Show "Saved just now" message
```

### Database Save Flow
```
User fills form → Click "Save to Cloud" → POST/PUT to API
→ Receive form ID → Store ID in localStorage
→ Show "Saved just now" message
```

### Load Flow
```
User opens form → Check localStorage for draft
→ If found, populate fields → Show "Last saved X ago"
```

## ⚙️ Configuration

### Form Type Mapping

Edit `lib/formStorage.ts` to add new form types:

```tsx
function getApiEndpoint(formType: string): string {
  const endpoints: Record<string, string> = {
    'building-structure': '/api/building-structure',
    'land-improvements': '/api/land-improvements',
    'machinery': '/api/machinery',
    'your-new-form': '/api/your-new-form', // Add here
  };
  return endpoints[formType] || `/api/${formType}`;
}
```

## 🐛 Troubleshooting

### Save not working?
1. Check console for errors
2. Verify `formType` matches API endpoint
3. Check if localStorage is available
4. Verify API route exists and accepts POST/PUT

### Draft not loading?
1. Check console for "Draft loaded" message
2. Verify localStorage has data (DevTools → Application → Local Storage)
3. Make sure `loadDraft()` is called in useEffect
4. Check field names match between save and load

### Database save fails?
1. Check network tab for API errors
2. Verify database schema matches form data
3. Check API route error messages
4. Ensure authentication if required

## 🎯 Best Practices

1. **Always collect form data in a function** - Makes it easy to save consistently
2. **Load draft on mount** - Use `useEffect` with empty dependency array
3. **Show save status** - Users should know when data is saved
4. **Handle errors gracefully** - Display error messages to users
5. **Clear drafts after submission** - Prevent confusion with old data
6. **Use meaningful form types** - Makes debugging easier
7. **Save before navigation** - Prevent data loss when moving between steps

## 📋 Checklist for Adding Save to a Form

- [ ] Import `useSaveForm` hook and `SaveButton` component
- [ ] Initialize the hook with correct `formType` and `step`
- [ ] Create `collectFormData()` function
- [ ] Add save button handlers
- [ ] Add `SaveStatus` to header
- [ ] Add save buttons to footer
- [ ] Implement draft loading in `useEffect`
- [ ] Test local save
- [ ] Test database save
- [ ] Test draft loading
- [ ] Test error handling

## 🚀 Example: Step 1 (Complete Implementation)

See `/app/rpfaas/building-structure/fill/page.tsx` for a complete working example.

Key features:
- ✅ Save to localStorage
- ✅ Save to database
- ✅ Load draft on mount
- ✅ Status indicators
- ✅ Error handling
- ✅ Works with complex form state

## 📖 Related Files

- `/hooks/useSaveForm.ts` - Main save hook
- `/lib/formStorage.ts` - Storage utilities
- `/components/SaveButton.tsx` - Save button components
- `/app/api/building-structure/route.ts` - API example
- `/app/rpfaas/building-structure/fill/page.tsx` - Implementation example

---

**Need help?** Check the example implementation or review the code comments in the utility files.
