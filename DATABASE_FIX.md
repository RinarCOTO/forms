# Quick Fix for Database Connection Error

## Problem
Your `.env` file has `DATABASE_URL` pointing to a local database that isn't running.

## Solution 1: Use Supabase (Recommended)

1. Go to your Supabase project: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/settings/database

2. Copy your **Connection String** (Transaction mode)

3. Update your `.env` file:

```bash
# Replace the existing DATABASE_URL with your Supabase connection string
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# For migrations, use Session mode:
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

4. Run these commands:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Restart your dev server
npm run dev
```

## Solution 2: Start Local Database

If you want to use a local database:

```bash
# Check if PostgreSQL is installed
which psql

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@14

# Or start manually
pg_ctl -D /usr/local/var/postgres start

# Create database
createdb forms_dev

# Update .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/forms_dev"

# Push schema
npx prisma db push
```

## Solution 3: Temporary Fix - Use Local Save Only

Until you set up the database, you can comment out the "Save to Cloud" button:

In `/app/rpfaas/building-structure/fill/page.tsx`:

```tsx
{/* Temporarily disabled until database is set up
<Button
  type="button"
  variant="outline"
  onClick={handleSaveDraftDatabase}
  disabled={isSaving}
>
  Save to Cloud
</Button>
*/}
```

The "Save Draft" button will still work (saves to localStorage).

## What I Recommend

**Use Supabase** since you already have it set up:

1. Get your Supabase connection string
2. Update `.env` with the correct `DATABASE_URL`
3. Run `npx prisma db push`
4. Restart your dev server

This is the fastest and most reliable solution!
