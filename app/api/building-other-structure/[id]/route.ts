import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  console.log('=== GET /api/building-other-structure/[id] - Route Hit ===');
  
  try {
    // Get the params (handle both sync and async params)
    const params = await Promise.resolve(context.params);
    const id = params.id;
    
    console.log('GET - Resolved ID:', id);
    
    if (!id) {
      console.log('GET - No ID in params, returning 400');
      return NextResponse.json(
        { success: false, message: 'No ID provided', error: 'Missing ID parameter' },
        { status: 400 }
      );
    }
    
    console.log('GET - Creating Supabase client with service role...');
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('GET - Fetching from building_structures with ID:', id);
    const { data: draft, error } = await supabase
      .from('building_structures')
      .select('*')
      .eq('id', id)
      .single();

    console.log('GET - Supabase response:', { draft, error });

    if (error) {
      console.error('GET - Supabase error:', error);
      return NextResponse.json(
        { success: false, message: 'Draft not found', error: error.message },
        { status: 404 }
      );
    }

    if (!draft) {
      console.error('GET - No draft returned from Supabase');
      return NextResponse.json(
        { success: false, message: 'Draft not found', error: 'No data returned' },
        { status: 404 }
      );
    }

    console.log('GET - Successfully fetched draft:', draft);
    return NextResponse.json({ 
      success: true, 
      data: draft  // Return the actual database record
    });
    
  } catch (error) {
    console.error('GET - Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  console.log('=== PUT /api/building-other-structure/[id] - Route Hit ===');
  
  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;
    
    console.log('PUT - Resolved ID:', id);
    
    if (!id) {
      console.log('PUT - No ID in params, returning 400');
      return NextResponse.json(
        { success: false, message: 'No ID provided', error: 'Missing ID parameter' },
        { status: 400 }
      );
    }
    
    const data = await req.json();
    console.log('PUT - Received data for ID', id, ':', JSON.stringify(data, null, 2));
    
    console.log('PUT - Creating Supabase client with service role...');
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('PUT - Updating building_structures table...');
    const { data: updatedRecord, error } = await supabase
      .from('building_structures')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    console.log('PUT - Supabase update response:', { updatedRecord, error });

    if (error) {
      console.error('PUT - Supabase error:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to update draft', 
          error: error.message,
          details: error
        },
        { status: 500 }
      );
    }

    if (!updatedRecord) {
      console.error('PUT - No record returned from update');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Record not found or not updated', 
          error: 'No data returned from update'
        },
        { status: 404 }
      );
    }

    console.log('PUT - Successfully updated draft:', updatedRecord);
    return NextResponse.json({ 
      success: true, 
      data: updatedRecord  // Return the actual updated database record
    });
    
  } catch (error) {
    console.error('PUT - Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}
