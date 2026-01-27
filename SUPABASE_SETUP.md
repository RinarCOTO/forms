# Supabase Setup Guide

This guide will help you set up Supabase for your RPFAAS Forms application.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is fine)
- Git (optional, for version control)

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in the details:
   - **Project Name**: `forms` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine for development
5. Click **"Create new project"**
6. Wait 2-3 minutes for setup to complete

## Step 2: Get Your API Keys

1. In your Supabase project, go to **Settings** (⚙️ icon in sidebar)
2. Click **API** in the settings menu
3. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project API keys**:
     - `anon` `public` key (safe to use in browser)
     - `service_role` key (keep secret!)

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   # From Supabase Dashboard > Settings > API
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   
   # From Supabase Dashboard > Settings > Database
   DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
   DIRECT_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
   ```

3. To get the DATABASE_URL:
   - Go to **Settings** > **Database**
   - Scroll to **Connection string**
   - Select **URI** tab
   - Copy the connection string (it includes your password)

## Step 4: Set Up Database Schema with Prisma

1. Update your `prisma/schema.prisma` datasource (should already be set):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

2. Push your schema to Supabase:
   ```bash
   npx prisma db push
   ```

3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

4. (Optional) Open Prisma Studio to view your database:
   ```bash
   npx prisma studio
   ```

## Step 5: Set Up Authentication (Optional)

### Enable Email Authentication

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Make sure **Email** is enabled
3. Configure email templates if needed

### Set Up Auth UI

The project includes login/signup pages at:
- `/login`
- `/signup`

These routes are protected by middleware and will redirect authenticated users.

## Step 6: Test Your Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. Try the following:
   - Visit `/signup` to create an account
   - Visit `/login` to sign in
   - Access protected routes like `/dashboard`

## Step 7: Verify Database Connection

Create a test script `scripts/test-supabase.ts`:

```typescript
import { createClient } from '@/lib/supabase/client'

async function testConnection() {
  const supabase = createClient()
  
  // Test database connection
  const { data, error } = await supabase
    .from('building_structures')
    .select('count')
    .limit(1)
  
  if (error) {
    console.error('❌ Connection failed:', error.message)
  } else {
    console.log('✅ Successfully connected to Supabase!')
    console.log('Database is accessible')
  }
}

testConnection()
```

## Local Development with Supabase CLI (Optional)

For local development, you can use Supabase CLI:

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase:
   ```bash
   supabase init
   ```

3. Start local Supabase:
   ```bash
   supabase start
   ```

4. Link to your cloud project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

5. Pull remote schema:
   ```bash
   supabase db pull
   ```

## Project Structure

```
/lib
  /supabase
    client.ts          # Browser client
    server.ts          # Server-side client
    middleware.ts      # Session management
middleware.ts          # Next.js middleware for auth
```

## Common Issues & Solutions

### Issue: "Invalid API key"
- Double-check your `.env.local` file
- Make sure you're using the `anon` key, not the `service_role` key
- Restart your dev server after changing env variables

### Issue: "Connection refused"
- Verify your DATABASE_URL is correct
- Check that your Supabase project is active
- Ensure you're using the correct password

### Issue: "Table doesn't exist"
- Run `npx prisma db push` to create tables
- Check Supabase Dashboard > Table Editor to verify tables

### Issue: "Authentication not working"
- Clear browser cookies/localStorage
- Check that middleware is properly configured
- Verify auth is enabled in Supabase Dashboard

## Next Steps

1. **Enable Row Level Security (RLS)**
   - Go to Supabase Dashboard > Authentication > Policies
   - Create policies for your tables

2. **Set Up Storage** (for file uploads)
   - Go to Storage in Supabase Dashboard
   - Create buckets for documents/images

3. **Configure Email Templates**
   - Customize signup/reset password emails
   - Add your branding

4. **Add Realtime Features** (optional)
   - Use Supabase Realtime for live updates
   - Perfect for collaborative forms

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Prisma with Supabase](https://supabase.com/partners/integrations/prisma)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

## Support

- Supabase Discord: [discord.supabase.com](https://discord.supabase.com)
- Prisma Discord: [pris.ly/discord](https://pris.ly/discord)

---

**🎉 Congratulations!** Your Supabase setup is complete. You can now build with a powerful backend, authentication, and real-time features!
