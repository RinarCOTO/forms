# How to Redeploy to Vercel

## Step 1: Add Environment Variables to Vercel

Run these commands one by one:

```bash
# Add Supabase URL
vercel env add NEXT_PUBLIC_SUPABASE_URL

# When prompted:
# - What's the value? Paste: https://weckxacnhzuzuvjvdyvj.supabase.co
# - Add to which Environments? Select all (Production, Preview, Development)

# Add Supabase Anon Key
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# When prompted:
# - What's the value? Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlY2t4YWNuaHp1enV2anZkeXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTYxNjQsImV4cCI6MjA4NTA3MjE2NH0.LuSQvKyMOfgwQKwnrZyw4iVBnQJaVj9nz9E3GIq95H8
# - Add to which Environments? Select all (Production, Preview, Development)
```

## Step 2: Redeploy

After adding environment variables, redeploy:

```bash
vercel --prod
```

## Alternative: Push to Git

If your project is connected to Git (GitHub/GitLab/Bitbucket):

```bash
git add .
git commit -m "Add Supabase environment variables"
git push
```

Vercel will automatically redeploy when you push to your repository.

## Quick Command (All in One)

```bash
cd /Users/rinar/Documents/forms
vercel --prod
```

This will:
1. Build your project
2. Deploy to production
3. Use the environment variables you just added

## Check Deployment Status

After running `vercel --prod`, you'll get a URL like:
- https://forms-xyz.vercel.app

Visit that URL to test if the error is fixed!
