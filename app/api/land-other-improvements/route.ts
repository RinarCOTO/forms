import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET: Fetch all land improvement records
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
    );
    
    const { data, error } = await supabase
      .from('land_improvements')
      .select('id, owner_name, updated_at, status')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching land improvements:', error);
      return NextResponse.json(
        { error: 'Failed to fetch land improvements', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create new land improvement record
export async function POST(request: Request) {
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
    );
    
    const body = await request.json();
    const { data, error } = await supabase
      .from('land_improvements')
      .insert([body])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating land improvement:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// PUT: Update existing land improvement record
export async function PUT(request: Request) {
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
    );
    
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('land_improvements')
      .update(body)
      .eq('id', body.id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating land improvement:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}
