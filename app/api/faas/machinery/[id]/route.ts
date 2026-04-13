import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getCurrentUserContext } from '@/lib/services/user.service';

const getSupabaseAdmin = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: 'public' } }
  );

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  console.log('=== GET /api/machinery/[id] - Route Hit ===');

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
      .from('machinery')
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
  console.log('=== PUT /api/machinery/[id] - Route Hit ===');

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
      .from('machinery')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Failed to update record', error: error.message, details: error },
        { status: 500 }
      );
    }

    if (!updatedRecord) {
      return NextResponse.json(
        { success: false, message: 'Record not found or not updated', error: 'No data returned from update' },
        { status: 404 }
      );
    }

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
  console.log('=== DELETE /api/machinery/[id] - Route Hit ===');

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

    const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin';

    if (!isAdmin) {
      // Non-admins can only delete their own draft or returned records
      const { data: record, error: recordError } = await supabase
        .from('machinery')
        .select('created_by, status')
        .eq('id', id)
        .single();

      if (recordError || !record) {
        return NextResponse.json(
          { success: false, message: 'Record not found', error: 'No record found with the specified ID' },
          { status: 404 }
        );
      }

      const isDeletableStatus = ['draft', 'returned'].includes(record.status);
      const isOwner = record.created_by === user.id;

      if (!isDeletableStatus || !isOwner) {
        return NextResponse.json(
          { success: false, message: 'Forbidden', error: 'You can only delete your own draft or returned records' },
          { status: 403 }
        );
      }
    }

    const { data: deletedRecord, error } = await supabase
      .from('machinery')
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

    return NextResponse.json({ success: true, message: 'Record deleted successfully', data: deletedRecord });
  } catch (error) {
    console.error('DELETE - Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}
