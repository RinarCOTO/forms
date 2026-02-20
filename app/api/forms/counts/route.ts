import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

const getCachedCounts = unstable_cache(
  async () => {
    const supabase = getSupabase()
    const [buildingCount, landCount, machineryCount, notesCount] = await Promise.all([
      supabase.from('building_structures').select('id', { count: 'exact', head: true }),
      supabase.from('land_improvements').select('id', { count: 'exact', head: true }),
      supabase.from('machinery').select('id', { count: 'exact', head: true }),
      supabase.from('notes').select('id', { count: 'exact', head: true }),
    ])
    return {
      'building-structure': buildingCount.count || 0,
      'land-improvements': landCount.count || 0,
      'machinery': machineryCount.count || 0,
      'notes': notesCount.count || 0,
    }
  },
  ['form-counts'],
  { tags: ['form-counts'], revalidate: 60 }
)

export async function GET() {
  try {
    const counts = await getCachedCounts()
    return NextResponse.json(counts)
  } catch (error) {
    console.error('Error fetching form counts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
