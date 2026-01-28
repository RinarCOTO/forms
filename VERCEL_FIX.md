# Fixing Vercel 500 MIDDLEWARE_INVOCATION_FAILED Error

## Problem
The middleware is failing on Vercel because environment variables are not set in the Vercel project.

## Solution

### Step 1: Add Environment Variables to Vercel

1. Go to your Vercel project settings:
   https://vercel.com/rinarcoto-projects/forms/settings/environment-variables

2. Add these two environment variables:

   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://weckxacnhzuzuvjvdyvj.supabase.co`
   - Environment: Select all (Production, Preview, Development)

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlY2t4YWNuaHp1enV2anZkeXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0OTYxNjQsImV4cCI6MjA4NTA3MjE2NH0.LuSQvKyMOfgwQKwnrZyw4iVBnQJaVj9nz9E3GIq95H8`
   - Environment: Select all (Production, Preview, Development)

3. Click **Save**

### Step 2: Redeploy

After adding the environment variables, you need to redeploy:

**Option A: Trigger a new deployment**
- Push a new commit to your repository, OR
- Go to Deployments tab and click "Redeploy" on the latest deployment

**Option B: Use Vercel CLI**
```bash
vercel --prod
```

### Step 3: Verify

Once redeployed, visit your site. The middleware error should be gone.

## Local Development

For local development, your `.env.local` file is already set up correctly with these variables.

## Quick Links

- Vercel Project: https://vercel.com/rinarcoto-projects/forms
- Environment Variables: https://vercel.com/rinarcoto-projects/forms/settings/environment-variables
- Supabase Settings: https://app.supabase.com/project/weckxacnhzuzuvjvdyvj/settings/api

## Testing

After fixing, test these URLs:
- Homepage: https://forms-[your-vercel-url].vercel.app/
- Login: https://forms-[your-vercel-url].vercel.app/login
- Dashboard: https://forms-[your-vercel-url].vercel.app/dashboard
