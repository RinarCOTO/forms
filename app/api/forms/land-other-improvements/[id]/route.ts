export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper function to initialize Supabase
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

// GET: Fetch single land improvement record by ID
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = await params
    
    const { data, error } = await supabase
      .from('land_improvements')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching land improvement:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch land improvement', details: error.message },
        { status: 500 }
      )
    }
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Land improvement not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update existing land improvement record
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = await params
    const body = await request.json()
    
    // Remove the id from the body to avoid conflicts
    const { id: bodyId, ...updateData } = body
    
    // Clean the data: remove undefined, null, and empty string values
    const cleanedData = Object.entries(updateData).reduce((acc, [key, value]) => {
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
    
    console.log('Cleaned update data:', cleanedData)
    
    const { data, error } = await supabase
      .from('land_improvements')
      .update(cleanedData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating land improvement:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update land improvement', details: error.message },
        { status: 500 }
      )
    }
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Land improvement not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Delete land improvement record
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseAdmin()
    const { id } = await params
    
    const { error } = await supabase
      .from('land_improvements')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting land improvement:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete land improvement', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, message: 'Land improvement deleted successfully' })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}