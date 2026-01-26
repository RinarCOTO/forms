# 🚀 Quick Deployment Guide

## Prerequisites
- [ ] GitHub account
- [ ] Vercel account (free)
- [ ] Git installed locally

## Step 1: Push to GitHub

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Name: `forms` (or your choice)
   - Visibility: Public
   - Don't initialize with README
   - Click "Create repository"

2. **Link your local repo and push:**
   ```bash
   # Replace YOUR_USERNAME with your GitHub username
   git remote add origin https://github.com/YOUR_USERNAME/forms.git
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

### Option A: Dashboard (Easiest)
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Select your `forms` repository
5. Click "Deploy" (Vercel auto-configures Next.js)
6. Wait ~2 minutes ☕
7. Done! Your site is live 🎉

### Option B: CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel
```

## Step 3: Update Your App

Whenever you make changes:
```bash
git add .
git commit -m "Your update message"
git push
```

Vercel automatically redeploys! 🚀

## Troubleshooting

### Build Errors
- Check that all dependencies are in `package.json`
- Ensure no TypeScript errors: `npm run build` locally
- Check Vercel build logs in the dashboard

### Environment Variables
If needed, add them in Vercel Dashboard:
- Go to Project Settings → Environment Variables
- Add variables and redeploy

## Your Live URLs
- Production: `https://forms.vercel.app` (or custom domain)
- Preview: Created automatically for each PR

## Support
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
