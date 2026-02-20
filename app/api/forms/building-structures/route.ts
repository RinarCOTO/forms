import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { unstable_cache, revalidateTag } from 'next/cache'

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
  })
}

const getCachedBuildingStructures = unstable_cache(
  async () => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('building_structures')
      .select('id, owner_name, updated_at, status')
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  },
  ['building-structures-list'],
  { tags: ['building-structures'], revalidate: 30 }
)

export async function GET() {
  try {
    const data = await getCachedBuildingStructures()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase()
    const body = await request.json()

    const { data, error } = await supabase
      .from('building_structures')
      .insert([body])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    revalidateTag('building-structures')
    revalidateTag('form-counts')

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * UPDATED: Added PUT method to handle updates for Step 2, Step 3, etc.
 * This is used when the frontend sends a request to /api/building-structure?id=...
 */
export async function PUT(request: Request) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 })
    }

    console.log(`Updating record ${id} with materials:`, {
      flooring: body.structural_materials_flooring_p3,
      walls: body.structural_materials_walls_p3,
    })

    const { data, error } = await supabase
      .from('building_structures')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidateTag('building-structures')

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Server Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
