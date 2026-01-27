# Supabase Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Next.js App                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Browser    │         │   Server     │                │
│  │  Components  │         │  Components  │                │
│  │              │         │              │                │
│  │  Uses: →     │         │  Uses: →     │                │
│  │  client.ts   │         │  server.ts   │                │
│  └──────┬───────┘         └──────┬───────┘                │
│         │                        │                         │
│         │  ┌──────────────────┐  │                         │
│         │  │   middleware.ts  │  │                         │
│         │  │  (Route Guard)   │  │                         │
│         │  └──────────────────┘  │                         │
│         │                        │                         │
└─────────┼────────────────────────┼─────────────────────────┘
          │                        │
          │   ┌─────────────────┐  │
          └──▶│   Supabase      │◀─┘
              │   Platform      │
              ├─────────────────┤
              │  • Auth         │
              │  • PostgreSQL   │
              │  • Storage      │
              │  • Realtime     │
              └─────────────────┘
```

## 🔄 Authentication Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Visit /login or /signup
     ▼
┌────────────────────┐
│  Auth Page         │
│  (Client Component)│
└────┬───────────────┘
     │
     │ 2. Submit credentials
     │    Uses: createClient() from lib/supabase/client.ts
     ▼
┌────────────────────┐
│  Supabase Auth     │
│  API               │
└────┬───────────────┘
     │
     │ 3. Return session token
     ▼
┌────────────────────┐
│  Cookies Set       │
│  (Auth Token)      │
└────┬───────────────┘
     │
     │ 4. Navigate to protected route
     ▼
┌────────────────────┐
│  middleware.ts     │
│  • Check session   │
│  • Refresh if      │
│    needed          │
└────┬───────────────┘
     │
     │ 5. If valid: continue
     │    If invalid: redirect to /login
     ▼
┌────────────────────┐
│  Protected Page    │
│  (e.g., /dashboard)│
└────────────────────┘
```

## 📊 Data Flow

### Client-Side Query
```
Component
   │
   │ createClient()
   ▼
lib/supabase/client.ts
   │
   │ Query data
   ▼
Supabase Database
   │
   │ Return data
   ▼
Component renders
```

### Server-Side Query
```
Server Component/API Route
   │
   │ await createClient()
   ▼
lib/supabase/server.ts
   │
   │ • Get cookies
   │ • Verify auth
   │ • Query data
   ▼
Supabase Database
   │
   │ Return data
   ▼
Response to client
```

## 🛡️ Security Layers

```
┌─────────────────────────────────────────┐
│          Client Request                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     Layer 1: middleware.ts              │
│     • Check authentication              │
│     • Refresh session if needed         │
│     • Redirect if unauthorized          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     Layer 2: Server/API Component       │
│     • Verify user again                 │
│     • Check permissions                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     Layer 3: Supabase RLS (Optional)    │
│     • Row Level Security policies       │
│     • Database-level access control     │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          Database Query                 │
└─────────────────────────────────────────┘
```

## 📁 File Organization

```
/Users/rinar/Documents/forms/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts         → Browser-side auth & queries
│   │   ├── server.ts         → Server-side auth & queries
│   │   └── middleware.ts     → Session management
│   ├── db.ts                 → Legacy PostgreSQL (can migrate)
│   └── prisma.ts             → Prisma client
│
├── middleware.ts             → Route protection
│
├── app/
│   ├── login/
│   │   ├── page.tsx          → Your current login
│   │   └── page-with-supabase.tsx.example  → Supabase example
│   │
│   ├── signup/
│   │   ├── page.tsx          → Your current signup
│   │   └── page-with-supabase.tsx.example  → Supabase example
│   │
│   └── api/
│       └── building-structure/
│           ├── route.ts      → Your current API
│           └── user/
│               └── route.ts.example  → Protected API example
│
├── prisma/
│   └── schema.prisma         → Updated for Supabase
│
├── .env.local                → Your secrets (create this)
├── .env.local.example        → Template
│
└── Documentation:
    ├── SUPABASE_SETUP.md     → Step-by-step guide
    ├── SUPABASE_QUICK_REF.md → Code snippets
    ├── SUPABASE_COMPLETE.md  → Setup summary
    └── SUPABASE_ARCHITECTURE.md → This file
```

## 🔌 Integration Points

### Current Setup → Supabase Migration Path

```
┌──────────────────────┐         ┌──────────────────────┐
│   Current (pg)       │         │   Supabase           │
├──────────────────────┤         ├──────────────────────┤
│                      │         │                      │
│ lib/db.ts            │   →     │ lib/supabase/        │
│ (raw SQL)            │         │ client.ts/server.ts  │
│                      │         │ (queries + auth)     │
│                      │         │                      │
│ DATABASE_URL         │   →     │ DATABASE_URL         │
│ (local/remote PG)    │         │ (Supabase PG)        │
│                      │         │                      │
│ No auth              │   →     │ Built-in auth        │
│                      │         │ + middleware         │
│                      │         │                      │
│ Manual queries       │   →     │ Prisma ORM           │
│                      │         │ + Supabase queries   │
└──────────────────────┘         └──────────────────────┘
```

### Benefits of Supabase

```
┌─────────────────────────────────────────────────────┐
│  What You Get with Supabase                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ✅ Built-in Authentication                         │
│     • Email/password                                │
│     • OAuth (Google, GitHub, etc.)                  │
│     • Magic links                                   │
│                                                     │
│  ✅ PostgreSQL Database                             │
│     • Same as you're using now                      │
│     • But managed and scalable                      │
│                                                     │
│  ✅ Row Level Security (RLS)                        │
│     • Database-level access control                 │
│     • Users can only see their own data             │
│                                                     │
│  ✅ Realtime Subscriptions                          │
│     • Live updates when data changes                │
│     • Perfect for collaborative features            │
│                                                     │
│  ✅ Storage                                          │
│     • File uploads (PDFs, images)                   │
│     • Perfect for form attachments                  │
│                                                     │
│  ✅ Auto-generated APIs                             │
│     • REST and GraphQL                              │
│     • Instant API from your schema                  │
│                                                     │
│  ✅ Dashboard                                        │
│     • Visual database editor                        │
│     • User management                               │
│     • Query editor                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## 🎯 Recommended Usage Pattern

```typescript
// ✅ Client Component (Browser)
'use client'
import { createClient } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = createClient()
  
  const handleLogin = async () => {
    const { data } = await supabase.auth.signInWithPassword({...})
  }
  
  return <button onClick={handleLogin}>Login</button>
}

// ✅ Server Component
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('buildings').select()
  return <div>{/* render */}</div>
}

// ✅ API Route
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { data } = await supabase
    .from('buildings')
    .select()
    .eq('created_by', user.email)
  
  return NextResponse.json(data)
}
```

## 🚀 Deployment Considerations

```
Development                Production
┌─────────────┐           ┌─────────────┐
│ Local Dev   │           │   Vercel    │
│ Server      │           │   (or host) │
└─────┬───────┘           └─────┬───────┘
      │                         │
      │ Same env vars           │ Same env vars
      ▼                         ▼
┌─────────────────────────────────────┐
│      Supabase (Production)          │
│      • Single endpoint              │
│      • Works from anywhere          │
│      • HTTPS by default             │
└─────────────────────────────────────┘
```

---

**📘 See Also:**
- `SUPABASE_SETUP.md` - Detailed setup instructions
- `SUPABASE_QUICK_REF.md` - Code examples and snippets
- `SUPABASE_COMPLETE.md` - Setup completion summary
