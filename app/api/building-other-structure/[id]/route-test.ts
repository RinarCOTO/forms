import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to initialize Supabase inside the dynamic route
const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' }
  });
};

export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const { id } = await params; // Standard Next.js 15+ param handling
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('building_structures') // Verify this table name matches your main route
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: any }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = getSupabase();

    console.log(`Updating record ${id} in Supabase...`);

    // We pass the body directly. 
    // It should contain structural_materials_flooring_p3, etc.
    const { data, error } = await supabase
      .from('building_structures')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase Update Error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data,
      message: 'Materials saved successfully' 
    });
  } catch (error: any) {
    console.error('ID Route PUT Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}