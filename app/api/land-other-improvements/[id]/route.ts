import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';

const getSupabaseAdmin = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: 'public' } }
  );

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  console.log('=== GET /api/land-other-improvements/[id] - Route Hit ===');

  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'No ID provided', error: 'Missing ID parameter' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: draft, error } = await supabase
      .from('land_improvements')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !draft) {
      return NextResponse.json(
        { success: false, message: 'Record not found', error: error?.message ?? 'No data returned' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: draft });
  } catch (error) {
    console.error('GET - Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  console.log('=== PUT /api/land-other-improvements/[id] - Route Hit ===');

  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'No ID provided', error: 'Missing ID parameter' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { id: _bodyId, ...updateData } = body;

    const supabase = getSupabaseAdmin();

    const { data: updatedRecord, error } = await supabase
      .from('land_improvements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to update record', error: error.message },
        { status: 500 }
      );
    }

    if (!updatedRecord) {
      return NextResponse.json(
        { success: false, message: 'Record not found or not updated', error: 'No data returned from update' },
        { status: 404 }
      );
    }

    revalidateTag('land-improvements');
    return NextResponse.json({ success: true, data: updatedRecord });
  } catch (error) {
    console.error('PUT - Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  console.log('=== DELETE /api/land-other-improvements/[id] - Route Hit ===');

  try {
    const params = await Promise.resolve(context.params);
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'No ID provided', error: 'Missing ID parameter' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Verify user is authenticated and has admin role
    const { createClient } = await import('@/lib/supabase/server');
    const sessionSupabase = await createClient();
    const { data: { user }, error: userError } = await sessionSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', error: 'Could not verify user role' },
        { status: 401 }
      );
    }

    if (userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden', error: 'Only admins and super admins can delete records' },
        { status: 403 }
      );
    }

    const { data: deletedRecord, error } = await supabase
      .from('land_improvements')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete record', error: error.message },
        { status: 500 }
      );
    }

    if (!deletedRecord) {
      return NextResponse.json(
        { success: false, message: 'Record not found or already deleted', error: 'No record found with the specified ID' },
        { status: 404 }
      );
    }

    revalidateTag('land-improvements');
    revalidateTag('form-counts');
    return NextResponse.json({ success: true, message: 'Record deleted successfully', data: deletedRecord });
  } catch (error) {
    console.error('DELETE - Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}
