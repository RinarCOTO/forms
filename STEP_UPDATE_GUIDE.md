# Guide: Updating Steps 3, 4, and 5

## Database Schema Available Columns

Based on the database schema (`database/schema.sql`), here are the available columns for each step:

### Step 3: Construction Details
- `roofing_material` (VARCHAR 100)
- `wall_material` (VARCHAR 100)
- `flooring_material` (VARCHAR 100)
- `ceiling_material` (VARCHAR 100)

### Step 4: Additional Details
- `electrical_system` (VARCHAR 100)
- `plumbing_system` (VARCHAR 100)
- `construction_type` (VARCHAR 100)
- `foundation_type` (VARCHAR 100)
- `building_permit_no` (VARCHAR 100)

### Step 5: Assessment
- `actual_use` (VARCHAR 100)
- `market_value` (DECIMAL 15,2)
- `assessment_level` (DECIMAL 5,2)
- `estimated_value` (DECIMAL 15,2)
- `amount_in_words` (TEXT)

---

## Step 3 Update Instructions

### Current Issue:
Step 3 uses `collectFormData()` that loops through ALL localStorage items from all steps. This should be changed to only collect Step 3 data.

### What Step 3 Should Save:
The form has complex material selection grids, but the database only has these simple text fields:
- `roofing_material`
- `wall_material`
- `flooring_material`
- `ceiling_material`

### Recommended Approach:

**Option 1: Serialize complex data to JSON strings**
```typescript
function collectFormData(materials: any, flooringGrid: any, wallsGrid: any) {
  const data: any = {};
  
  // Serialize roofing materials to JSON string
  if (materials) {
    data.roofing_material = JSON.stringify(materials);
  }
  
  // Serialize flooring grid to JSON string
  if (flooringGrid && flooringGrid.length > 0) {
    data.flooring_material = JSON.stringify(flooringGrid);
  }
  
  // Serialize walls grid to JSON string
  if (wallsGrid && wallsGrid.length > 0) {
    data.wall_material = JSON.stringify(wallsGrid);
  }
  
  return data;
}
```

**Option 2: Convert to readable text summary**
```typescript
function collectFormData(materials: any, flooringGrid: any, wallsGrid: any, materialsOtherText: string) {
  const data: any = {};
  
  // Convert materials checkboxes to comma-separated text
  const selectedMaterials = [];
  if (materials.reinforcedConcrete) selectedMaterials.push('Reinforced Concrete');
  if (materials.longspanRoof) selectedMaterials.push('Longspan Roof');
  if (materials.tiles) selectedMaterials.push('Tiles');
  if (materials.giSheets) selectedMaterials.push('GI Sheets');
  if (materials.aluminum) selectedMaterials.push('Aluminum');
  if (materials.others && materialsOtherText) selectedMaterials.push(materialsOtherText);
  
  if (selectedMaterials.length > 0) {
    data.roofing_material = selectedMaterials.join(', ');
  }
  
  // Summarize flooring (you'll need to implement logic based on your grid structure)
  // Example: "Floor 1: Concrete, Tiles; Floor 2: Marble, Wood"
  
  // Summarize walls (similar approach)
  
  return data;
}
```

### Changes Needed:
1. Update `collectFormData()` to accept form state as parameters
2. Update `handleNext()` to pass form state to `collectFormData()`
3. Remove localStorage loop logic

---

## Step 4 Update Instructions

### What Step 4 Should Save:
Based on your form, Step 4 likely collects:
- `electrical_system` - Type of electrical system
- `plumbing_system` - Type of plumbing system
- `construction_type` - Type of construction
- `foundation_type` - Type of foundation
- `building_permit_no` - Building permit number

### Example Implementation:
```typescript
function collectFormData(
  electricalSystem: string,
  plumbingSystem: string,
  constructionType: string,
  foundationType: string,
  buildingPermitNo: string
) {
  const data: any = {};
  
  if (electricalSystem) data.electrical_system = electricalSystem;
  if (plumbingSystem) data.plumbing_system = plumbingSystem;
  if (constructionType) data.construction_type = constructionType;
  if (foundationType) data.foundation_type = foundationType;
  if (buildingPermitNo) data.building_permit_no = buildingPermitNo;
  
  return data;
}
```

---

## Step 5 Update Instructions

### What Step 5 Should Save:
Step 5 is the final assessment step:
- `actual_use` - Actual use of the building
- `market_value` - Market value (decimal)
- `assessment_level` - Assessment level percentage (decimal)
- `estimated_value` - Estimated value (decimal)
- `amount_in_words` - Amount written in words

### Example Implementation:
```typescript
function collectFormData(
  actualUse: string,
  marketValue: number | string,
  assessmentLevel: number | string,
  estimatedValue: number | string,
  amountInWords: string
) {
  const data: any = {};
  
  if (actualUse) data.actual_use = actualUse;
  if (marketValue) data.market_value = marketValue.toString();
  if (assessmentLevel) data.assessment_level = assessmentLevel.toString();
  if (estimatedValue) data.estimated_value = estimatedValue.toString();
  if (amountInWords) data.amount_in_words = amountInWords;
  
  return data;
}
```

---

## General Pattern for All Steps

### 1. Update `collectFormData()` function:
```typescript
// OLD - Don't use this
function collectFormData() {
  const data: any = {};
  for (let i = 0; i < localStorage.length; i++) {
    // loops through everything...
  }
  return data;
}

// NEW - Use this pattern
function collectFormData(field1: string, field2: string, ...) {
  const data: any = {};
  if (field1) data.db_column_name = field1;
  if (field2) data.db_column_name2 = field2;
  return data;
}
```

### 2. Update `handleNext()` function:
```typescript
const handleNext = async () => {
  setIsSaving(true);
  try {
    // Pass current form state to collectFormData
    const formData = collectFormData(stateVar1, stateVar2, stateVar3);
    formData.status = 'draft';
    
    console.log('Saving Step X form data to Supabase:', formData);
    
    let response;
    const currentDraftId = draftId || localStorage.getItem('draft_id');
    
    if (currentDraftId) {
      response = await fetch(`/api/building-structure/${currentDraftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } else {
      response = await fetch('/api/building-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }

    if (response.ok) {
      const result = await response.json();
      console.log('Save result:', result);
      if (result.data?.id) {
        localStorage.setItem('draft_id', result.data.id.toString());
        const savedDraftId = result.data.id;
        // Navigate to next step
        router.push(`/building-other-structure/fill/step-X?id=${savedDraftId}`);
      }
    } else {
      const error = await response.json();
      console.error('Save error:', error);
      alert('Failed to save: ' + (error.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error saving:', error);
    alert('Error saving. Please try again.');
  } finally {
    setIsSaving(false);
  }
};
```

---

## Quick Checklist

For each step (3, 4, 5):

- [ ] Identify all form state variables (useState)
- [ ] Update `collectFormData()` to accept those variables as parameters
- [ ] Map form variables to correct database column names
- [ ] Remove localStorage loop from `collectFormData()`
- [ ] Update `handleNext()` to call `collectFormData(field1, field2, ...)`
- [ ] Test that data saves and merges with previous steps
- [ ] Verify in Supabase database that all fields are populated

---

## Testing After Updates

1. Fill out Step 1 → Click Next → Check database (should have owner info)
2. Fill out Step 2 → Click Next → Check database (should have step 1 + step 2 data)
3. Fill out Step 3 → Click Next → Check database (should have steps 1, 2, 3 data)
4. Continue for steps 4 and 5
5. Final record should have data from ALL steps merged together

---

## Need Help?

If you need me to implement any specific step, let me know which one and I'll write the exact code for you!
