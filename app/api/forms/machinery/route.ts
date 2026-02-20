import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

const getCachedMachinery = unstable_cache(
  async () => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('machinery')
      .select('id, owner_name, updated_at, status')
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  },
  ['machinery-list'],
  { tags: ['machinery'], revalidate: 30 }
)

export async function GET() {
  try {
    const data = await getCachedMachinery()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching machinery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
