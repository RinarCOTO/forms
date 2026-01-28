# 🚀 Deploy to Vercel (Existing Project)

This guide will help you deploy your RPFAAS Forms application to an existing Vercel project.

## 📋 Prerequisites

- [x] Vercel account
- [x] Existing Vercel project
- [x] Supabase project setup (`weckxacnhzuzuvjvdyvj`)
- [x] Git repository

---

## 🔧 Step 1: Prepare Your Project

### 1.1 Install Vercel CLI (if not already installed)

```bash
npm i -g vercel
```

### 1.2 Login to Vercel

```bash
vercel login
```

---

## 🔗 Step 2: Link to Your Existing Project

```bash
# Run this in your project directory
vercel link
```

When prompted:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Select your account/team
3. **Link to existing project?** → **Yes**
4. **What's the name of your existing project?** → Enter your existing project name

This creates a `.vercel` folder with your project configuration.

---

## 🔐 Step 3: Set Environment Variables

You have two options:

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://weckxacnhzuzuvjvdyvj.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` (your anon key) | Production, Preview, Development |
| `DATABASE_URL` | `postgresql://postgres:sh%40kn%21Rinar%21%21@db.weckxacnhzuzuvjvdyvj.supabase.co:5432/postgres` | Production, Preview, Development |
| `DIRECT_URL` | `postgresql://postgres:sh%40kn%21Rinar%21%21@db.weckxacnhzuzuvjvdyvj.supabase.co:5432/postgres` | Production, Preview, Development |

5. Click **Save** for each variable

### Option B: Via CLI

```bash
# Add environment variables one by one
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste: https://weckxacnhzuzuvjvdyvj.supabase.co
# Select: Production, Preview, Development (all)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your anon key
# Select: Production, Preview, Development (all)

vercel env add DATABASE_URL
# Paste your database URL
# Select: Production, Preview, Development (all)

vercel env add DIRECT_URL
# Paste your direct URL
# Select: Production, Preview, Development (all)
```

---

## 🚀 Step 4: Deploy

### Initial Deployment

```bash
vercel --prod
```

This will:
1. Build your Next.js application
2. Generate Prisma Client
3. Upload to Vercel
4. Deploy to production

### Subsequent Deployments

```bash
# For production
vercel --prod

# For preview (testing)
vercel
```

---

## 🗄️ Step 5: Run Database Migrations

After deployment, you need to ensure your Prisma schema is synced with Supabase:

### Option A: Push Schema to Supabase

```bash
# This will push your Prisma schema to Supabase database
npx prisma db push
```

### Option B: Run Migrations

```bash
# Generate migration
npx prisma migrate dev --name init

# Deploy migration to production
npx prisma migrate deploy
```

---

## ✅ Step 6: Verify Deployment

1. Visit your Vercel deployment URL
2. Test authentication:
   - Go to `/signup` and create an account
   - Login at `/login`
   - Check if you can access `/dashboard`
3. Test database connection:
   - Fill out a form
   - Check if data saves to Supabase

---

## 🔄 Continuous Deployment (Auto-Deploy on Git Push)

### Link Git Repository

1. Go to Vercel Dashboard → Your Project → **Settings** → **Git**
2. Connect your GitHub/GitLab/Bitbucket repository
3. Configure:
   - **Production Branch**: `main` or `master`
   - **Auto-deploy**: Enable

Now every push to your main branch will automatically deploy to Vercel! 🎉

---

## 🐛 Troubleshooting

### Build Fails

**Error: Prisma Client not generated**
```bash
# Add postinstall script to package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

**Error: Module not found**
```bash
# Clear cache and rebuild
vercel --force
```

### Environment Variables Not Working

1. Check variable names are correct (case-sensitive)
2. Ensure all environments are selected (Production, Preview, Development)
3. Redeploy after adding variables:
   ```bash
   vercel --prod
   ```

### Database Connection Issues

1. Verify DATABASE_URL is correctly URL-encoded
2. Check Supabase project is active
3. Test connection locally first:
   ```bash
   npx prisma db pull
   ```

### Authentication Issues

1. Verify Supabase URL and Anon Key are correct
2. Check Supabase Auth is enabled in your project
3. Add your Vercel domain to Supabase allowed URLs:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add: `https://your-project.vercel.app`

---

## 📊 Monitor Deployment

View logs and metrics:

```bash
# View deployment logs
vercel logs

# View production logs
vercel logs --prod

# Follow logs in real-time
vercel logs --follow
```

Or check the Vercel Dashboard for detailed metrics.

---

## 🔗 Useful Commands

```bash
# List all deployments
vercel list

# Remove a deployment
vercel remove [deployment-url]

# View project info
vercel inspect

# Pull environment variables locally
vercel env pull .env.local

# Open project in browser
vercel open
```

---

## 🎯 Quick Deploy Checklist

- [ ] Vercel CLI installed
- [ ] Logged into Vercel
- [ ] Project linked: `vercel link`
- [ ] Environment variables set
- [ ] Build tested locally: `npm run build`
- [ ] Database schema pushed: `npx prisma db push`
- [ ] Deploy to production: `vercel --prod`
- [ ] Test authentication on live site
- [ ] Test form submissions
- [ ] Set up auto-deployment with Git

---

## 🌐 Your Deployment URLs

After deployment, you'll get:
- **Production**: `https://your-project.vercel.app`
- **Preview**: `https://your-project-hash.vercel.app` (for each PR/commit)

---

## 📝 Notes

1. **First deployment** may take 2-5 minutes
2. **Subsequent deployments** are faster (~1-2 minutes)
3. Vercel automatically handles:
   - SSL certificates
   - CDN distribution
   - Edge caching
   - Serverless functions

Happy deploying! 🚀
