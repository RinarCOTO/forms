export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper function to initialize Supabase
// This prevents repeating the same config in GET and POST
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Use Service Role Key for admin tasks
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      // Add schema config to ensure we're connecting to the right database
      db: {
        schema: 'public'
      }
    }
  )
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('land_improvements')
      .select('id, owner_name, updated_at, status')
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching land improvements:', error)
      return NextResponse.json(
        { error: 'Failed to fetch land improvements', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} // <--- This closing brace was missing in your original code

// POST: Create new land improvement record
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    
    const body = await request.json();
    
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
      .single();
      
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}