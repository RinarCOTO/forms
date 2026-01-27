## Supabase Quick Reference

### Client-Side (Browser)

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Sign out
const { error } = await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Query data
const { data, error } = await supabase
  .from('building_structures')
  .select('*')
  .eq('status', 'active')
  .limit(10)

// Insert data
const { data, error } = await supabase
  .from('building_structures')
  .insert([{ arp_no: '123', owner_name: 'John Doe' }])

// Update data
const { data, error } = await supabase
  .from('building_structures')
  .update({ status: 'completed' })
  .eq('id', 1)

// Delete data
const { data, error } = await supabase
  .from('building_structures')
  .delete()
  .eq('id', 1)
```

### Server-Side (Server Components/API Routes)

```typescript
import { createClient } from '@/lib/supabase/server'

// In Server Component
export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('building_structures').select()
  return <div>{/* render data */}</div>
}

// In Route Handler (API)
export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('building_structures').select()
  return Response.json(data)
}
```

### With Prisma

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Using Prisma with Supabase database
const buildings = await prisma.buildingStructure.findMany({
  where: { status: 'active' },
  take: 10
})
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

### Protected Routes

Protected by middleware in `middleware.ts`:
- `/dashboard`
- `/rpfaas/*`
- `/notes`

Auto-redirects:
- Logged in + visiting `/login` or `/signup` → `/dashboard`
- Not logged in + visiting protected route → `/login`

### Useful Commands

```bash
# Setup Supabase
./scripts/setup-supabase.sh

# Push schema to Supabase
npx prisma db push

# Generate Prisma client
npx prisma generate

# View database
npx prisma studio

# Start dev server
npm run dev
```
