import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Fetch counts for all form types
    const [buildingCount, landCount, machineryCount, notesCount] = await Promise.all([
      supabase.from('building_structures').select('id', { count: 'exact', head: true }),
      supabase.from('land_improvements').select('id', { count: 'exact', head: true }),
      supabase.from('machinery').select('id', { count: 'exact', head: true }),
      supabase.from('notes').select('id', { count: 'exact', head: true }),
    ])

    return NextResponse.json({
      'building-structure': buildingCount.count || 0,
      'land-improvements': landCount.count || 0,
      'machinery': machineryCount.count || 0,
      'notes': notesCount.count || 0,
    })
  } catch (error) {
    console.error('Error fetching form counts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
