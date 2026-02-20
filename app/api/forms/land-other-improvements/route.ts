import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { unstable_cache, revalidateTag } from 'next/cache'

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' },
    }
  )

const getCachedLandImprovements = unstable_cache(
  async () => {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('land_improvements')
      .select('id, owner_name, updated_at, status')
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  },
  ['land-improvements-list'],
  { tags: ['land-improvements'], revalidate: 30 }
)

export async function GET() {
  try {
    const data = await getCachedLandImprovements()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching land improvements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch land improvements', details: error.message },
      { status: 500 }
    )
  }
}

// POST: Create new land improvement record
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    // Clean the data: remove undefined, null, and empty string values
    const cleanedData = Object.entries(body).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'undefined') {
        // Convert numeric strings to numbers for decimal fields
        if (['area', 'market_value', 'assessment_level', 'assessed_value'].includes(key)) {
          const numValue = parseFloat(value as string)
          if (!isNaN(numValue)) {
            acc[key] = numValue
          }
        } else {
          acc[key] = value
        }
      }
      return acc
    }, {} as any)

    console.log('Cleaned insert data:', cleanedData)

    const { data, error } = await supabase
      .from('land_improvements')
      .insert([cleanedData])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    revalidateTag('land-improvements')
    revalidateTag('form-counts')

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 })
  }
}
