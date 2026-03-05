import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'No ID provided' },
        { status: 400 }
      );
    }

    // Verify authentication
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const sessionSupabase = await createServerClient();
    const { data: { user }, error: userError } = await sessionSupabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: draft, error } = await supabase
      .from('building_structures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('GET /api/building-other-structure/[id] error:', error.code);
      return NextResponse.json(
        { success: false, message: 'Draft not found' },
        { status: 404 }
      );
    }

    if (!draft) {
      return NextResponse.json(
        { success: false, message: 'Draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: draft });

  } catch (error) {
    console.error('GET /api/building-other-structure/[id] error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'No ID provided' },
        { status: 400 }
      );
    }

    const data = await req.json();

    // Verify authentication
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const sessionSupabase = await createServerClient();
    const { data: { user }, error: userError } = await sessionSupabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: updatedRecord, error } = await supabase
      .from('building_structures')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('PUT /api/building-other-structure/[id] error:', error.code);
      return NextResponse.json(
        { success: false, message: 'Failed to update draft' },
        { status: 500 }
      );
    }

    if (!updatedRecord) {
      return NextResponse.json(
        { success: false, message: 'Record not found or not updated' },
        { status: 404 }
      );
    }

    revalidateTag('building-structures', 'max');
    return NextResponse.json({ success: true, data: updatedRecord });

  } catch (error) {
    console.error('PUT /api/building-other-structure/[id] error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { success: false, message: 'Server error' },
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
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role from users table using service role key
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or super_admin
    if (userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const { data: deletedRecord, error } = await supabase
      .from('building_structures')
      .delete()
      .eq('id', id)
      .select()
      .single();

    console.log('DELETE - Supabase delete response:', { deletedRecord, error });

    if (error) {
      console.error('DELETE /api/building-other-structure/[id] error:', error.code);
      return NextResponse.json(
        { success: false, message: 'Failed to delete record' },
        { status: 500 }
      );
    }

    if (!deletedRecord) {
      return NextResponse.json(
        { success: false, message: 'Record not found or already deleted' },
        { status: 404 }
      );
    }
    revalidateTag('building-structures', 'max');
    revalidateTag('form-counts', 'max');
    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
      data: deletedRecord
    });
    
  } catch (error) {
    console.error('DELETE /api/building-other-structure/[id] error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
