# Fix: Add Missing Columns to building_structures Table

## Problem
The form is trying to save `admin_care_of`, `admin_address`, and `property_address` fields, but these columns don't exist in the database.

## Solution
Add the missing columns to the `building_structures` table.

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project (weckxacnhzuzuvjvdyvj)
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste this SQL:

```sql
ALTER TABLE building_structures
ADD COLUMN IF NOT EXISTS admin_care_of VARCHAR(255),
ADD COLUMN IF NOT EXISTS admin_address TEXT,
ADD COLUMN IF NOT EXISTS property_address TEXT;
```

6. Click "Run" or press Cmd/Ctrl + Enter
7. You should see a success message

### Method 2: Using psql (if you have direct database access)

If you have `psql` installed and database credentials:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.weckxacnhzuzuvjvdyvj.supabase.co:5432/postgres" -c "ALTER TABLE building_structures ADD COLUMN IF NOT EXISTS admin_care_of VARCHAR(255), ADD COLUMN IF NOT EXISTS admin_address TEXT, ADD COLUMN IF NOT EXISTS property_address TEXT;"
```

### Verify the columns were added

Run this query in Supabase SQL Editor to verify:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'building_structures'
ORDER BY ordinal_position;
```

You should see the new columns: `admin_care_of`, `admin_address`, and `property_address`.

## After Adding Columns

1. The "Save Draft" button should now work correctly
2. Try saving your form again
3. Check the browser console for any errors (F12 -> Console tab)

## What the columns store

- **admin_care_of**: The administration/care of field (person managing the property)
- **admin_address**: The full address of the administrator (Barangay, Municipality, Province)
- **property_address**: The property street address (No/Street/Sitio and location)
