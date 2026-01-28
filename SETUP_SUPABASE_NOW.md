# 🎯 Setup Supabase Database - Quick Guide

## Goal
Connect your forms to Supabase so all data saves to the cloud database.

## What You Need
1. Your Supabase database password
2. 2 minutes of your time

## How to Set Up

### Option 1: Automated Setup (Recommended) ⭐

Run this command:
```bash
./setup-supabase.sh
```

It will:
1. Ask for your database password
2. Update your .env file
3. Create tables in Supabase
4. Test the connection
5. Give you next steps

### Option 2: Manual Setup

1. **Get your database password**
   - Go to: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/settings/database
   - Find "Database password" 
   - Copy it (or reset if forgotten)

2. **Update .env file**
   Replace the DATABASE_URL line with:
   ```bash
   DATABASE_URL="postgresql://postgres.weckxacnhzuzuvjvdyvj:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
   (Replace `[YOUR-PASSWORD]` with your actual password)

3. **Create tables**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Re-enable Save to Cloud button**
   - Edit: `app/rpfaas/building-structure/fill/page.tsx`
   - Line ~228: Change `disabled={true}` to `disabled={isSaving}`

5. **Restart**
   ```bash
   npm run dev
   ```

## After Setup

Once complete, you can:
- ✅ Use "Save to Cloud" button in forms
- ✅ Data saves to Supabase database
- ✅ View data in Supabase dashboard
- ✅ Access from any device
- ✅ Automatic backups

## View Your Data

After saving forms:
- Go to: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/editor
- Select `building_structures` table
- See your saved data!

## Need Help?

If setup fails:
1. Check your database password is correct
2. Ensure Supabase project is active (not paused)
3. Check network connection
4. Read error messages carefully

---

**Ready?** Run: `./setup-supabase.sh`
