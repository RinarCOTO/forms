import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

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
    revalidateTag('building-structures');
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

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  console.log('=== DELETE /api/building-other-structure/[id] - Route Hit ===');
  
  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;
    
    console.log('DELETE - Resolved ID:', id);
    
    if (!id) {
      console.log('DELETE - No ID in params, returning 400');
      return NextResponse.json(
        { success: false, message: 'No ID provided', error: 'Missing ID parameter' },
        { status: 400 }
      );
    }

    console.log('DELETE - Creating Supabase client with service role...');
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user info from session cookie using regular supabase client
    const { createClient } = await import('@/lib/supabase/server');
    const sessionSupabase = await createClient();
    
    const { data: { user }, error: userError } = await sessionSupabase.auth.getUser();
    
    if (userError || !user) {
      console.log('DELETE - No authenticated user:', userError);
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('DELETE - Authenticated user:', user.id);

    // Get user role from users table using service role key
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.log('DELETE - Could not get user profile:', profileError);
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Could not verify user role' },
        { status: 401 }
      );
    }

    // Check if user is admin or super_admin
    if (userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
      console.log('DELETE - User does not have permission, role:', userProfile.role);
      return NextResponse.json(
        { success: false, message: 'Forbidden', error: 'Only admins and super admins can delete records' },
        { status: 403 }
      );
    }

    console.log('DELETE - User authorized, role:', userProfile.role);
    console.log('DELETE - Deleting from building_structures table...');
    
    const { data: deletedRecord, error } = await supabase
      .from('building_structures')
      .delete()
      .eq('id', id)
      .select()
      .single();

    console.log('DELETE - Supabase delete response:', { deletedRecord, error });

    if (error) {
      console.error('DELETE - Supabase error:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to delete record', 
          error: error.message,
          details: error
        },
        { status: 500 }
      );
    }

    if (!deletedRecord) {
      console.error('DELETE - No record deleted (may not exist)');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Record not found or already deleted', 
          error: 'No record found with the specified ID'
        },
        { status: 404 }
      );
    }

    console.log('DELETE - Successfully deleted record:', deletedRecord);
    revalidateTag('building-structures');
    revalidateTag('form-counts');
    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
      data: deletedRecord
    });
    
  } catch (error) {
    console.error('DELETE - Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}
