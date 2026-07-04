import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { unstable_cache } from 'next/cache'

const getSupabase = () => createSupabaseAdminClient({ allowAnonFallback: true })

const getCachedNotes = unstable_cache(
  async () => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, updated_at, status')
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  },
  ['notes-list'],
  { tags: ['notes'], revalidate: 30 }
)

export async function GET() {
  try {
    const data = await getCachedNotes()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
