# 🎯 5-Minute Vercel Deployment

## Quick Start (For Existing Vercel Project)

### 1️⃣ Link Your Project (One-Time Setup)

```bash
vercel link
```

**Answer the prompts:**
- Set up and deploy? → **Yes**
- Which scope? → Select your account
- Link to existing project? → **Yes** 
- Project name? → Enter your existing project name

---

### 2️⃣ Add Environment Variables

Go to your Vercel Dashboard:
https://vercel.com/dashboard

**Navigate:** Your Project → Settings → Environment Variables

**Add these 4 variables:**

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://weckxacnhzuzuvjvdyvj.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development

NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlY2t4YWNuaHp1enV2anZkeXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTYxNjQsImV4cCI6MjA4NTA3MjE2NH0.LuSQvKyMOfgwQKwnrZyw4iVBnQJaVj9nz9E3GIq95H8
Environments: ✅ Production ✅ Preview ✅ Development

DATABASE_URL
Value: postgresql://postgres:sh%40kn%21Rinar%21%21@db.weckxacnhzuzuvjvdyvj.supabase.co:5432/postgres
Environments: ✅ Production ✅ Preview ✅ Development

DIRECT_URL
Value: postgresql://postgres:sh%40kn%21Rinar%21%21@db.weckxacnhzuzuvjvdyvj.supabase.co:5432/postgres
Environments: ✅ Production ✅ Preview ✅ Development
```

---

### 3️⃣ Deploy

**Option A: Use our script (Easiest)**
```bash
./scripts/deploy-vercel.sh
```

**Option B: Manual command**
```bash
vercel --prod
```

---

### 4️⃣ Done! 🎉

Your app is live! The terminal will show your URL:
```
✅ Production: https://your-project.vercel.app
```

---

## 🔄 Future Deployments

Just run:
```bash
vercel --prod
```

Or use the script:
```bash
./scripts/deploy-vercel.sh
```

---

## 🔗 Set Up Auto-Deploy (Optional but Recommended)

1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Connect your GitHub repository
3. Enable auto-deploy

Now every push to `main` automatically deploys! ✨

---

## ⚡ Quick Commands

```bash
vercel --prod          # Deploy to production
vercel                 # Deploy preview
vercel logs            # View logs
vercel open            # Open in browser
vercel env pull        # Download env variables
```

---

## 🆘 Common Issues

**Build fails?**
```bash
npm run build  # Test locally first
```

**Environment variables not working?**
- Make sure all 3 environments are checked (Production, Preview, Development)
- Redeploy after adding variables

**Database connection error?**
- Run `npx prisma db push` to sync schema with Supabase

---

## 📞 Need Help?

Check the detailed guide: `VERCEL_DEPLOYMENT.md`
