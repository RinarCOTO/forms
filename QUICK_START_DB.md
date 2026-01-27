# Quick Start Guide for PostgreSQL Integration

## Step 1: Install Dependencies

```bash
npm install pg @types/pg
```

## Step 2: Setup Database

### Option A: Automated Setup (Recommended)
```bash
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

### Option B: Manual Setup
1. Create database:
```bash
psql -U postgres
CREATE DATABASE forms_db;
\q
```

2. Run schema:
```bash
psql -U postgres -d forms_db -f database/schema.sql
```

3. Create `.env.local`:
```bash
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

## Step 3: Test Connection

Create `scripts/test-db.js`:
```javascript
const { testConnection } = require('../lib/db');
testConnection();
```

Run:
```bash
node scripts/test-db.js
```

## Step 4: Update Your Forms

Add this to your form's `handleSubmit`:

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  // Collect data from localStorage
  const formData = {
    arp_no: localStorage.getItem("arp_no_p1"),
    owner_name: localStorage.getItem("owner_name_p1"),
    type_of_building: localStorage.getItem("type_of_building_p2"),
    actual_use: actualUse,
    estimated_value: estimatedValue,
    amount_in_words: amountInWords,
    // ... add all other fields
  };
  
  // Save to database
  const response = await fetch('/api/building-structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  
  if (response.ok) {
    localStorage.clear();
    router.push("/rpfaas/building-structure/view");
  }
};
```

## Step 5: Start Development

```bash
npm run dev
```

## Troubleshooting

### "Cannot find module 'pg'"
```bash
npm install pg @types/pg
```

### "Connection refused"
Check if PostgreSQL is running:
```bash
pg_isready
# If not running:
brew services start postgresql@15
```

### View Database
```bash
psql -U postgres -d forms_db
\dt  # List tables
SELECT * FROM building_structures;
```

## Full Documentation

See `POSTGRESQL_SETUP_GUIDE.md` for complete guide.
