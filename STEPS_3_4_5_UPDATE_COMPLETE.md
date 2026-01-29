# Steps 3, 4, and 5 Update Complete ✅

All three remaining steps have been successfully updated to use the per-step save functionality!

---

## What Was Changed

### **Step 3: Materials** (`step-3/page.tsx`)

#### Old Behavior:
- Used `collectFormData()` that looped through ALL localStorage items
- Saved data from all 5 steps at once

#### New Behavior:
- `collectFormData(materials, materialsOtherText, flooringGrid, wallsGrid)` accepts form state parameters
- Only saves Step 3 data to these database columns:
  - `roofing_material` - Comma-separated list of selected roofing materials
  - `flooring_material` - JSON string of flooring grid data
  - `wall_material` - JSON string of walls grid data

#### Example Data Saved:
```json
{
  "roofing_material": "Reinforced Concrete, GI Sheets, Other: Asbestos",
  "flooring_material": "[[true,false,true],[false,true,false],...]",
  "wall_material": "[[true,true,false],[false,false,true],...]",
  "status": "draft"
}
```

---

### **Step 4: Construction Details** (`step-4/page.tsx`)

#### Old Behavior:
- Used `collectFormData()` that looped through ALL localStorage items
- Saved data from all 5 steps at once

#### New Behavior:
- `collectFormData(selectedOptions)` accepts selected construction options
- Only saves Step 4 data to:
  - `construction_type` - Comma-separated list of selected construction conditions/defects

#### Example Data Saved:
```json
{
  "construction_type": "Physical deterioration, Functional obsolescence, Roof Issues",
  "status": "draft"
}
```

#### Note:
If your Step 4 form has additional fields like:
- `electrical_system`
- `plumbing_system`
- `foundation_type`
- `building_permit_no`

You can add them as parameters to `collectFormData()` and map them to the database columns.

---

### **Step 5: Assessment** (`step-5/page.tsx`)

#### Old Behavior:
- Used `collectFormData()` that looped through ALL localStorage items
- Saved data from all 5 steps at once

#### New Behavior:
- `collectFormData(actualUse, estimatedValue, amountInWords)` accepts form state parameters
- Only saves Step 5 data to:
  - `actual_use` - Actual use of the building (e.g., "Residential", "Commercial")
  - `estimated_value` - Estimated value as number
  - `amount_in_words` - Amount written in words

#### Example Data Saved:
```json
{
  "actual_use": "Residential",
  "estimated_value": "1500000",
  "amount_in_words": "One Million Five Hundred Thousand",
  "status": "draft"
}
```

#### Note:
If your Step 5 form has additional fields like:
- `market_value`
- `assessment_level`

You can add them as parameters to `collectFormData()` and map them to the database columns.

---

## How Data Merges Across Steps

With the updated code, data progressively builds in the database:

### Step 1 → Database:
```json
{
  "id": 1,
  "owner_name": "John Doe",
  "owner_address": "Bel-Air, Makati City, Metro Manila",
  "admin_care_of": "Jane Smith",
  "admin_address": "Poblacion, Makati City, Metro Manila",
  "property_address": "123 Main St",
  "status": "draft",
  "created_at": "2026-01-29T10:00:00Z",
  "updated_at": "2026-01-29T10:00:00Z"
}
```

### Step 2 → Database (Merged):
```json
{
  "id": 1,
  "owner_name": "John Doe",              // ← From Step 1
  "owner_address": "Bel-Air...",          // ← From Step 1
  "type_of_building": "residential",      // ← NEW from Step 2
  "structure_type": "type_a",             // ← NEW from Step 2
  "date_constructed": "2020-01-01",       // ← NEW from Step 2
  "number_of_storeys": "2",               // ← NEW from Step 2
  "total_floor_area": "150.5",            // ← NEW from Step 2
  "status": "draft",
  "updated_at": "2026-01-29T10:05:00Z"    // ← Updated
}
```

### Step 3 → Database (Merged):
```json
{
  "id": 1,
  "owner_name": "John Doe",                        // ← From Step 1
  "type_of_building": "residential",                // ← From Step 2
  "roofing_material": "Reinforced Concrete, GI...", // ← NEW from Step 3
  "flooring_material": "[[true,false...]]",         // ← NEW from Step 3
  "wall_material": "[[true,true...]]",              // ← NEW from Step 3
  "status": "draft",
  "updated_at": "2026-01-29T10:10:00Z"              // ← Updated
}
```

### Step 4 → Database (Merged):
```json
{
  "id": 1,
  "owner_name": "John Doe",                        // ← From Step 1
  "type_of_building": "residential",                // ← From Step 2
  "roofing_material": "Reinforced Concrete...",     // ← From Step 3
  "construction_type": "Physical deterioration...", // ← NEW from Step 4
  "status": "draft",
  "updated_at": "2026-01-29T10:15:00Z"              // ← Updated
}
```

### Step 5 → Database (Final - Merged):
```json
{
  "id": 1,
  "owner_name": "John Doe",                        // ← From Step 1
  "type_of_building": "residential",                // ← From Step 2
  "roofing_material": "Reinforced Concrete...",     // ← From Step 3
  "construction_type": "Physical deterioration...", // ← From Step 4
  "actual_use": "Residential",                      // ← NEW from Step 5
  "estimated_value": "1500000",                     // ← NEW from Step 5
  "amount_in_words": "One Million Five...",         // ← NEW from Step 5
  "status": "draft",
  "updated_at": "2026-01-29T10:20:00Z"              // ← Updated
}
```

**Result:** One complete record with data from all 5 steps! 🎉

---

## Key Features

### ✅ Per-Step Save
- Each step only saves its own data
- No more collecting from all localStorage items
- Clean, maintainable code

### ✅ Data Merging
- API's PUT endpoint uses `if (body.field !== undefined)` logic
- Only updates fields that are provided
- Preserves existing data from previous steps

### ✅ No Overwrites
- Step 2 doesn't erase Step 1 data
- Step 3 doesn't erase Steps 1 & 2 data
- And so on...

### ✅ Draft ID Management
- First step creates new record, gets ID
- Subsequent steps update the same record
- Draft ID passed via URL: `?id=123`

---

## Testing Checklist

Test the complete flow to ensure data merges correctly:

- [ ] **Step 1**: Fill owner info → Click Next
  - Check database: Should have owner fields only
  
- [ ] **Step 2**: Fill building info → Click Next
  - Check database: Should have owner + building fields
  
- [ ] **Step 3**: Fill materials → Click Next
  - Check database: Should have owner + building + materials fields
  
- [ ] **Step 4**: Fill construction details → Click Next
  - Check database: Should have owner + building + materials + construction fields
  
- [ ] **Step 5**: Fill assessment → Click Preview
  - Check database: Should have ALL fields from all 5 steps

### How to Check Database:
1. Go to Supabase Dashboard
2. Open "Table Editor"
3. Select "building_structures" table
4. Find your record by ID
5. Verify all fields are populated

---

## Console Logging

Each step logs what it's saving:

```javascript
console.log('Saving Step X form data to Supabase:', formData);
console.log('Save result:', result);
```

Open browser DevTools (F12) → Console tab to see what's being saved at each step.

---

## Troubleshooting

### Issue: Data from previous steps is missing

**Solution:** Check that:
1. Each step is using the correct draft ID from URL
2. You're clicking "Next" (not refreshing the page)
3. API is using PUT (not POST) for updates
4. API has `if (body.field !== undefined)` logic

### Issue: Getting 500 errors

**Solution:** Check console for:
- Invalid column names (must match database schema)
- Wrong data types (numbers as strings, etc.)
- Missing draft ID

### Issue: Step X saves but data doesn't show in database

**Solution:**
- Check that the field names in `collectFormData()` match database column names exactly
- Verify the API route has the field in its `if (body.field !== undefined)` list

---

## Success! 🎉

All steps are now configured to:
- ✅ Save only their own data
- ✅ Merge with existing data
- ✅ Preserve data from previous steps
- ✅ Use the same draft ID throughout the flow

Your multi-step form with cloud save is complete!
