# Supabase Setup Checklist

Use this checklist to track your Supabase setup progress.

## 📋 Setup Steps

### 1. Create Supabase Project
- [ ] Go to https://supabase.com and sign up/login
- [ ] Click "New Project"
- [ ] Enter project name: `forms`
- [ ] Create and save database password (⚠️ Important!)
- [ ] Select region closest to you
- [ ] Wait 2-3 minutes for project to be created

### 2. Get Credentials
- [ ] Go to Settings > API
- [ ] Copy Project URL
- [ ] Copy Anon (public) key
- [ ] Go to Settings > Database
- [ ] Copy Connection string (URI format)

### 3. Configure Environment
- [ ] Run: `cp .env.local.example .env.local`
- [ ] Edit `.env.local` with your credentials:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `DATABASE_URL`
  - [ ] `DIRECT_URL`

### 4. Install & Setup Database
- [ ] Run: `npm install` (if not done already)
- [ ] Run: `npx prisma generate`
- [ ] Run: `npx prisma db push`
- [ ] Verify tables in Supabase Dashboard > Table Editor

### 5. Test Setup
- [ ] Start dev server: `npm run dev`
- [ ] Visit: http://localhost:3000
- [ ] Check no console errors related to Supabase
- [ ] Try accessing a protected route (should redirect to login)

### 6. Implement Authentication (Optional)
- [ ] Update `app/login/page.tsx` with Supabase auth
  - [ ] Use example: `app/login/page-with-supabase.tsx.example`
- [ ] Update `app/signup/page.tsx` with Supabase auth
  - [ ] Use example: `app/signup/page-with-supabase.tsx.example`
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test logout flow

### 7. Protect Your Routes
- [ ] Verify middleware is working
- [ ] Test protected routes:
  - [ ] `/dashboard` - should require login
  - [ ] `/rpfaas/*` - should require login
  - [ ] `/notes` - should require login
- [ ] Test public routes still work

### 8. Update API Routes
- [ ] Review: `app/api/building-structure/user/route.ts.example`
- [ ] Update existing API routes to:
  - [ ] Use Supabase auth
  - [ ] Check user permissions
  - [ ] Associate data with users

### 9. Security (Important!)
- [ ] Enable Row Level Security (RLS) in Supabase
  - [ ] Go to Table Editor > building_structures
  - [ ] Enable RLS
  - [ ] Add policies (see guide below)
- [ ] Repeat for all tables
- [ ] Test that users can only see their own data

### 10. Optional Enhancements
- [ ] Set up email templates in Supabase
- [ ] Configure OAuth providers (Google, GitHub)
- [ ] Set up Supabase Storage for file uploads
- [ ] Enable Realtime for live updates
- [ ] Add user profiles table
- [ ] Implement password reset flow

## 🔒 Row Level Security (RLS) Policies

### For `building_structures` table:

```sql
-- Enable RLS
ALTER TABLE building_structures ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own records
CREATE POLICY "Users can view own building structures"
ON building_structures
FOR SELECT
USING (auth.uid()::text = created_by OR auth.email() = created_by);

-- Policy: Users can insert their own records
CREATE POLICY "Users can create building structures"
ON building_structures
FOR INSERT
WITH CHECK (auth.email() = created_by);

-- Policy: Users can update their own records
CREATE POLICY "Users can update own building structures"
ON building_structures
FOR UPDATE
USING (auth.email() = created_by)
WITH CHECK (auth.email() = created_by);

-- Policy: Users can delete their own records
CREATE POLICY "Users can delete own building structures"
ON building_structures
FOR DELETE
USING (auth.email() = created_by);
```

Repeat similar policies for:
- [ ] `land_improvements`
- [ ] `machinery`

## ✅ Verification Tests

### Authentication
```bash
# Should work:
- Create account at /signup
- Login at /login
- Access /dashboard when logged in
- Logout functionality

# Should fail:
- Access /dashboard when logged out (redirect to /login)
- Access /login when logged in (redirect to /dashboard)
```

### Database
```bash
# Should work:
- View tables in Supabase Dashboard
- Run: npx prisma studio
- Query data through Supabase client
- Insert data with user association

# Should fail:
- Access data from other users (with RLS enabled)
```

### API Routes
```bash
# Test with curl or Postman:
GET /api/building-structure/user
# Should return 401 if not authenticated
# Should return user's data if authenticated
```

## 🐛 Troubleshooting Checklist

### If authentication not working:
- [ ] Check `.env.local` has correct values
- [ ] Restart dev server after env changes
- [ ] Clear browser cookies and localStorage
- [ ] Check Supabase project is active
- [ ] Verify middleware.ts is in root directory

### If database not working:
- [ ] Check DATABASE_URL format
- [ ] Verify password in connection string
- [ ] Check tables exist in Supabase Dashboard
- [ ] Run `npx prisma db push` again
- [ ] Check for Prisma client generation errors

### If queries fail:
- [ ] Check RLS policies aren't too restrictive
- [ ] Verify user is authenticated
- [ ] Check table and column names match schema
- [ ] Look at Supabase logs in Dashboard

## 📚 Resources Used

- [x] Created `lib/supabase/client.ts`
- [x] Created `lib/supabase/server.ts`
- [x] Created `lib/supabase/middleware.ts`
- [x] Created `middleware.ts`
- [x] Updated `prisma/schema.prisma`
- [x] Created `.env.local.example`
- [x] Created `SUPABASE_SETUP.md`
- [x] Created `SUPABASE_QUICK_REF.md`
- [x] Created `SUPABASE_ARCHITECTURE.md`
- [x] Created `SUPABASE_COMPLETE.md`
- [x] Created example files

## 🎯 Next Actions

After completing this checklist:

1. **Development**
   - [ ] Start building features with auth
   - [ ] Implement user-specific data filtering
   - [ ] Add file upload capabilities

2. **Testing**
   - [ ] Test all auth flows
   - [ ] Test data isolation between users
   - [ ] Test on mobile devices

3. **Deployment**
   - [ ] Add environment variables to Vercel/host
   - [ ] Test production build
   - [ ] Monitor Supabase usage

4. **Polish**
   - [ ] Customize email templates
   - [ ] Add loading states
   - [ ] Improve error messages
   - [ ] Add user profile management

## ✨ Success Indicators

You'll know setup is complete when:
- ✅ Users can signup and login
- ✅ Protected routes redirect correctly
- ✅ Data is saved to Supabase
- ✅ Users only see their own data
- ✅ No console errors
- ✅ Everything works in production

---

**Need Help?**
- 📖 See `SUPABASE_SETUP.md` for detailed instructions
- 💡 See `SUPABASE_QUICK_REF.md` for code examples
- 🏗️ See `SUPABASE_ARCHITECTURE.md` for system overview
- 🆘 Check Supabase Discord: https://discord.supabase.com

**Date Started:** _____________
**Date Completed:** _____________
