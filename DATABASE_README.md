# PostgreSQL Database Setup - Complete Guide

You've successfully received all the necessary files to connect your RPFAAS forms application to PostgreSQL! 🎉

## 🍎 First Time? Install PostgreSQL on Mac

**If you haven't installed PostgreSQL yet**, see the detailed installation guide:
👉 **[POSTGRESQL_INSTALLATION_MAC.md](POSTGRESQL_INSTALLATION_MAC.md)** 👈

This comprehensive guide covers:
- Installing PostgreSQL using Homebrew (recommended)
- Alternative installation methods (Postgres.app, Official installer)
- Post-installation setup
- Troubleshooting common issues
- GUI tools for database management

**Already installed PostgreSQL?** Continue below! ⬇️

---

## 📁 Files Created

The following files have been created in your project:

1. **`POSTGRESQL_SETUP_GUIDE.md`** - Complete, detailed guide
2. **`QUICK_START_DB.md`** - Quick reference for setup
3. **`database/schema.sql`** - Database schema with all tables
4. **`lib/db.ts`** - Database connection utility
5. **`app/api/building-structure/route.ts`** - API endpoints for CRUD operations
6. **`app/api/building-structure/[id]/route.ts`** - API endpoints for single record
7. **`.env.local.example`** - Example environment variables
8. **`scripts/setup-db.sh`** - Automated setup script

## 🚀 Quick Setup (5 minutes)

### 1. Install Prisma and PostgreSQL Driver

```bash
npm install prisma @prisma/client
npm install -D @prisma/client
```

### 2. Initialize and Configure Database

If you haven't already created your PostgreSQL database:

```bash
# Create database manually
psql -U postgres -c "CREATE DATABASE forms_db;"

# Run the schema to create tables
psql -U postgres -d forms_db -f database/schema.sql
```

Then configure Prisma:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (syncs Prisma with existing tables)
npx prisma db push
```

### 3. Create Environment File

Create `.env.local` in your project root:

```bash
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/forms_db"
```

Replace `yourpassword` with your actual PostgreSQL password.

### 4. Test the Connection

```bash
npx prisma studio
```

This opens Prisma Studio at `http://localhost:5555` where you can view your data!

### 5. Start Development

```bash
npm run dev
```

## 📋 Manual Setup (if you prefer)

If you prefer to set up manually:

### Step 1: Create Database

```bash
psql -U postgres
```

In the PostgreSQL prompt:
```sql
CREATE DATABASE forms_db;
\q
```

### Step 2: Run Schema

```bash
psql -U postgres -d forms_db -f database/schema.sql
```

### Step 3: Configure Environment

Create `.env.local`:
```bash
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/forms_db"
```

Replace `yourpassword` with your actual PostgreSQL password.

## 🔌 Using the Database in Your Forms

### Save Form Data to Database

Update your `step-5/page.tsx` file's `handleSubmit` function:

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  try {
    // Collect all data from localStorage
    const formData = {
      arp_no: localStorage.getItem("arp_no_p1") || "",
      pin: localStorage.getItem("pin_p1") || "",
      owner_name: localStorage.getItem("owner_name_p1") || "",
      owner_address: localStorage.getItem("owner_address_p1") || "",
      type_of_building: localStorage.getItem("type_of_building_p2") || "",
      number_of_storeys: parseInt(localStorage.getItem("number_of_storeys_p2") || "0"),
      date_constructed: localStorage.getItem("date_constructed_p2") || null,
      date_completed: localStorage.getItem("date_completed_p2") || null,
      date_occupied: localStorage.getItem("date_occupied_p2") || null,
      total_floor_area: parseFloat(localStorage.getItem("total_floor_area_p3") || "0"),
      construction_type: localStorage.getItem("construction_type_p3") || "",
      structure_type: localStorage.getItem("structure_type_p3") || "",
      electrical_system: localStorage.getItem("electrical_system_p4") || "",
      plumbing_system: localStorage.getItem("plumbing_system_p4") || "",
      roofing_material: localStorage.getItem("roofing_material_p4") || "",
      actual_use: actualUse,
      estimated_value: estimatedValue,
      amount_in_words: amountInWords,
      status: "completed", // or "draft"
    };
    
    // Send to API
    const response = await fetch('/api/building-structure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('✅ Form saved successfully!');
      // Clear localStorage
      localStorage.clear();
      // Redirect to view page
      router.push("/rpfaas/building-structure/view");
    } else {
      alert('❌ Failed to save: ' + result.error);
    }
  } catch (error) {
    console.error('Error saving data:', error);
    alert('❌ Failed to save data. Please try again.');
  }
};
```

### Fetch Saved Records

Create a new page to view saved records:

```typescript
// app/rpfaas/building-structure/view/page.tsx
"use client";

import { useEffect, useState } from "react";

interface BuildingStructure {
  id: number;
  arp_no: string;
  owner_name: string;
  type_of_building: string;
  estimated_value: number;
  created_at: string;
}

export default function ViewBuildingStructures() {
  const [records, setRecords] = useState<BuildingStructure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/building-structure');
      const result = await response.json();
      
      if (result.success) {
        setRecords(result.data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Building Structures</h1>
      
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ARP No</th>
            <th className="p-2 border">Owner</th>
            <th className="p-2 border">Type</th>
            <th className="p-2 border">Value</th>
            <th className="p-2 border">Date</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td className="p-2 border">{record.arp_no}</td>
              <td className="p-2 border">{record.owner_name}</td>
              <td className="p-2 border">{record.type_of_building}</td>
              <td className="p-2 border">₱{record.estimated_value?.toLocaleString()}</td>
              <td className="p-2 border">
                {new Date(record.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 🗄️ Database Schema Overview

Your database includes these tables:

1. **`building_structures`** - Main building/structure records
2. **`land_improvements`** - Land improvement records
3. **`machinery`** - Machinery records
4. **`users`** - For future authentication
5. **`audit_logs`** - Track all changes

## 🔍 Useful PostgreSQL Commands

### View Your Data
```bash
psql -U postgres -d forms_db

# Inside psql:
\dt                    # List all tables
\d building_structures # Describe table structure
SELECT * FROM building_structures LIMIT 10;
```

### Count Records
```sql
SELECT COUNT(*) FROM building_structures;
```

### Search Records
```sql
SELECT * FROM building_structures 
WHERE owner_name ILIKE '%juan%';
```

### Backup Database
```bash
pg_dump -U postgres forms_db > backup.sql
```

### Restore Database
```bash
psql -U postgres forms_db < backup.sql
```

## 📊 API Endpoints

Your application now has these endpoints:

- `POST /api/building-structure` - Create new record
- `GET /api/building-structure` - Get all records
- `GET /api/building-structure/:id` - Get single record
- `PUT /api/building-structure/:id` - Update record
- `DELETE /api/building-structure/:id` - Delete record

### Query Parameters (GET all records)
- `?status=draft` - Filter by status
- `?search=juan` - Search by owner name or ARP number
- `?limit=10&offset=0` - Pagination

## 🛠️ Troubleshooting

### Issue: "Cannot find module 'pg'"
**Solution:**
```bash
npm install pg @types/pg
```

### Issue: "Connection refused"
**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql@15
```

### Issue: "Database does not exist"
**Solution:**
```bash
psql -U postgres -c "CREATE DATABASE forms_db;"
```

### Issue: "Password authentication failed"
**Solution:** Update your `.env.local` with the correct password

## 🎯 Next Steps

1. ✅ Install `pg` package
2. ✅ Run setup script or manual setup
3. ✅ Test database connection
4. ⬜ Update your form submission logic
5. ⬜ Create view/list pages for saved records
6. ⬜ Add search and filter functionality
7. ⬜ Add edit and delete functionality
8. ⬜ Implement user authentication (optional)

## 📚 Documentation

- **Complete Guide:** See `POSTGRESQL_SETUP_GUIDE.md`
- **Quick Reference:** See `QUICK_START_DB.md`
- **Database Schema:** See `database/schema.sql`

## 💡 Tips

1. **Always backup** before making schema changes
2. Use **prepared statements** (already implemented in `lib/db.ts`)
3. Add **indexes** for frequently queried fields
4. **Don't commit** `.env.local` to git (already in .gitignore)
5. Use **transactions** for related operations

## 🆘 Need Help?

If you encounter any issues:

1. Check the full guide: `POSTGRESQL_SETUP_GUIDE.md`
2. Verify PostgreSQL is running: `pg_isready`
3. Check your `.env.local` configuration
4. View server logs in your terminal

---

**Ready to go?** Start with:
```bash
npm install pg @types/pg
./scripts/setup-db.sh
npm run dev
```

Good luck! 🚀
