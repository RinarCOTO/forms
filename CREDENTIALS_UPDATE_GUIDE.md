# 🔑 What Credentials to Update - Step by Step

## Quick Answer

You need to update **DATABASE_URL** in your `.env` file with the correct Supabase connection string.

---

## 📋 Step-by-Step Instructions

### Step 1: Go to Supabase Database Settings

**Open this URL:** https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/settings/database

### Step 2: Find the Connection String

Scroll down until you see a section called **"Connection string"**

You'll see several options/tabs:
- PSQL
- **URI** ← Click this one!
- JDBC
- .NET
- etc.

### Step 3: Click the "URI" Tab

This will show you the connection string in this format:

```
postgresql://postgres.[something]:[YOUR-PASSWORD]@[hostname]:[port]/postgres
```

### Step 4: Copy the Entire String

Click the copy button or select all and copy.

**Example of what you might see:**
```
postgresql://postgres.weckxacnhzuzuvjvdyvj:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

**Important:** If you see `[YOUR-PASSWORD]`, you need to replace it with your actual database password!

---

## 🔐 Get Your Database Password

If you don't know your database password:

1. On the same page, look for **"Database password"** section
2. You'll see: `••••••••••••` (hidden)
3. Click **"Reset database password"** if needed
4. Copy the new password
5. **Save it somewhere safe!**

---

## ✏️ What to Update in Your .env File

### Option A: Use the Automated Script (Easiest)

Run this command and follow the prompts:
```bash
./get-supabase-credentials.sh
```

It will:
- Ask you to paste the connection string
- Automatically encode special characters in password
- Update your .env file
- Test the connection

### Option B: Manual Update

1. **Open** `.env` file in your editor

2. **Find** the line starting with `DATABASE_URL=`

3. **Replace** it with your copied connection string from Supabase

4. **Important:** If your password has special characters, encode them:
   - `@` → `%40`
   - `!` → `%21`
   - `#` → `%23`
   - `$` → `%24`
   - `%` → `%25`
   - `&` → `%26`

**Example:**

❌ **Wrong** (unencoded):
```bash
DATABASE_URL="postgresql://postgres:sh@kn!Rinar!!@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

✅ **Correct** (encoded):
```bash
DATABASE_URL="postgresql://postgres:sh%40kn%21Rinar%21%21@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
```

---

## 🎯 Summary - What You Need

### From Supabase Dashboard:

1. **Connection String** (URI format)
   - Location: Database Settings → Connection string → URI tab
   - Example: `postgresql://postgres.xxx:[PASSWORD]@host:port/postgres`

2. **Database Password** 
   - Location: Database Settings → Database password
   - Used to replace `[YOUR-PASSWORD]` in the connection string

### What Goes in .env File:

```bash
# Single line - the complete connection string with:
# - Correct hostname from Supabase
# - Your password URL-encoded
# - Correct port (usually 5432 or 6543)

DATABASE_URL="postgresql://[user]:[encoded-password]@[host]:[port]/postgres"
```

---

## ✅ After Updating

Once you've updated the .env file:

```bash
# 1. Test the connection
npx prisma db push

# 2. If successful, you'll see:
# "Your database is now in sync with your schema"

# 3. Then re-enable "Save to Cloud" button
./enable-cloud-save.sh

# 4. Restart your dev server
npm run dev
```

---

## 🆘 Quick Commands

```bash
# Get credentials interactively
./get-supabase-credentials.sh

# Test connection after updating
npx prisma db push

# Re-enable save to cloud button
./enable-cloud-save.sh

# View your current DATABASE_URL
cat .env | grep DATABASE_URL
```

---

## 📸 Visual Guide

```
Supabase Dashboard
└── Settings (left sidebar)
    └── Database
        └── Scroll down to:
            ├── Database password
            │   └── [Click "Reset" if needed]
            │   └── Copy the password
            │
            └── Connection string
                └── Click "URI" tab
                └── Copy entire string
                └── Replace [YOUR-PASSWORD] with actual password
```

---

## 🎯 TL;DR

**Run this command and follow the prompts:**

```bash
./get-supabase-credentials.sh
```

It will guide you through everything!

**Or manually:**

1. Go to: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/settings/database
2. Copy the connection string from "URI" tab
3. Replace `[YOUR-PASSWORD]` with your actual password
4. URL-encode special characters
5. Update DATABASE_URL in .env file
6. Run: `npx prisma db push`

**That's it!** ✅
