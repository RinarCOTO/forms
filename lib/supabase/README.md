# Supabase Client Library

This directory contains the Supabase client utilities for your application.

## Files

### `client.ts`
Browser-side Supabase client for use in Client Components.

**When to use:**
- Client Components (files with `'use client'`)
- Browser-side data fetching
- User interactions (login, signup, etc.)

**Example:**
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const supabase = createClient()
  
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }
  
  return <form>...</form>
}
```

### `server.ts`
Server-side Supabase client for use in Server Components and API Routes.

**When to use:**
- Server Components (default in Next.js App Router)
- API Routes (`app/api/*/route.ts`)
- Server Actions
- Middleware

**Example:**
```typescript
// Server Component
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data } = await supabase
    .from('building_structures')
    .select()
    .eq('created_by', user.email)
  
  return <div>{/* render data */}</div>
}

// API Route
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { data } = await supabase.from('building_structures').select()
  return NextResponse.json(data)
}
```

### `middleware.ts`
Helper functions for session management and cookie handling.

**When to use:**
- Called by Next.js middleware (root `middleware.ts`)
- Handles auth state refresh
- Manages cookies for SSR

**Note:** You typically don't import this directly. It's used by the root `middleware.ts` file.

## Common Patterns

### Authentication

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe',
    },
  },
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
})

// Sign out
const { error } = await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### Database Queries

```typescript
// Select
const { data, error } = await supabase
  .from('building_structures')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10)

// Insert
const { data, error } = await supabase
  .from('building_structures')
  .insert([
    { arp_no: '123', owner_name: 'John Doe' }
  ])
  .select()
  .single()

// Update
const { data, error } = await supabase
  .from('building_structures')
  .update({ status: 'completed' })
  .eq('id', 1)
  .select()

// Delete
const { data, error } = await supabase
  .from('building_structures')
  .delete()
  .eq('id', 1)
```

### Realtime Subscriptions

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export function RealtimeComponent() {
  const supabase = createClient()
  
  useEffect(() => {
    const channel = supabase
      .channel('building-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'building_structures',
        },
        (payload) => {
          console.log('Change received!', payload)
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  return <div>Listening for changes...</div>
}
```

## Best Practices

### ✅ Do's

- Use `client.ts` for browser-side operations
- Use `server.ts` for server-side operations
- Always check for errors after Supabase operations
- Use TypeScript types for better type safety
- Handle loading and error states in UI

### ❌ Don'ts

- Don't use `client.ts` in Server Components
- Don't use `server.ts` in Client Components
- Don't expose service role key in client code
- Don't skip error handling
- Don't forget to unsubscribe from realtime channels

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Note: These use `NEXT_PUBLIC_` prefix because they're used in both client and server code.

## TypeScript

For better type safety, generate types from your database:

```bash
npx supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

Then use in your code:

```typescript
import { Database } from '@/types/supabase'

const supabase = createClient<Database>()
```

## Further Reading

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
