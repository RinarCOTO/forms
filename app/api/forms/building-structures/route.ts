import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
    console.log('Service Role Key:', supabaseServiceKey ? 'Set (length: ' + supabaseServiceKey.length + ')' : 'Not set');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      )
    }
    
    // Use service role key to bypass RLS
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    )
    
    const { data, error } = await supabase
      .from('building_structures')
      .select('id, owner_name, updated_at, status')
      .order('updated_at', { ascending: false })
    console.log('Supabase SELECT error:', error);
    console.log('Supabase SELECT data:', data);
    if (error) {
      console.error('Error fetching building structures:', error)
      return NextResponse.json(
        { error: 'Failed to fetch building structures', details: error.message, code: error.code },
        { status: 500 }
      )
    }
    if (!data) {
      console.error('No data returned from Supabase');
      return NextResponse.json(
        { error: 'No data returned from Supabase' },
        { status: 500 }
      )
    }
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY' },
        { status: 500 }
      )
    }
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    )
    const body = await request.json();
    console.log('POST body:', body);
    // Insert a new row with the provided data
    const { data, error } = await supabase
      .from('building_structures')
      .insert([body])
      .select()
      .single();
    console.log('Supabase INSERT error:', error);
    console.log('Supabase INSERT data:', data);
    if (error) {
      return NextResponse.json(
        { error: 'Failed to create building structure', details: error.message, code: error.code },
        { status: 500 }
      )
    }
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
