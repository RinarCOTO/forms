# Per-Step Save Strategy

## Current Issue
When clicking "Save Draft" on any step, the form was saving ALL data from localStorage across all steps, which caused issues and wasn't the intended behavior.

## Solution
Each step should now save ONLY its own data when "Save Draft" is clicked.

## Changes Made

### Step 1 - Owner and Property Location
**Fields Saved:**
- `owner_name`
- `owner_address` (built from Province/Municipality/Barangay)
- `admin_care_of`
- `admin_address` (built from Province/Municipality/Barangay)
- `property_address`

### Step 2 - General Description  
**Fields Saved:**
- `type_of_building`
- `structural_type`
- `date_constructed`
- `building_age`
- `number_of_storeys`
- `total_floor_area`

### Steps 3, 4, 5
Need to be updated similarly to save only their specific fields.

## How It Works Now

1. **Step 1**: User fills owner info → Click "Save Draft" → Saves only step 1 fields
2. **Step 2**: User fills building info → Click "Save Draft" → Updates draft with step 2 fields (merges with existing)
3. **Step 3**: User fills materials → Click "Save Draft" → Updates draft with step 3 fields
4. And so on...

## Database Behavior

- **First save (Step 1)**: Creates new record with step 1 data, returns draft ID
- **Subsequent saves (Steps 2-5)**: Updates the same record using the draft ID, merging new fields

## Implementation Pattern

Each step now has its own `collectFormData()` function that:
1. Takes only the state variables from that step as parameters
2. Returns only the fields relevant to that step
3. Doesn't loop through localStorage looking for other step data

## Files Updated
- ✅ Step 1: `/app/building-other-structure/fill/step-1/page.tsx`
- ✅ Step 2: `/app/building-other-structure/fill/step-2/page.tsx`
- ⏳ Step 3: Needs update
- ⏳ Step 4: Needs update
- ⏳ Step 5: Needs update

## Next Steps

Each remaining step (3, 4, 5) needs:
1. Identify all form fields in that step
2. Create a `collectFormData()` function that takes those fields as parameters
3. Update `handleSave()` to pass the fields to `collectFormData()`
4. Remove any localStorage looping logic

This ensures clean, predictable saves where each step is responsible only for its own data.
