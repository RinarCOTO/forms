import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidateTag } from 'next/cache';
import { getCurrentUserContext } from '@/lib/services/user.service';

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

    const raw = await req.json();

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

    const userCtx = await getCurrentUserContext();
    if (!userCtx) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Block updates on approved forms — fetch current status first
    const { data: current, error: fetchErr } = await supabase
      .from('building_structures')
      .select('status')
      .eq('id', id)
      .single();
    if (fetchErr || !current) {
      return NextResponse.json({ success: false, message: 'Form not found' }, { status: 404 });
    }
    if (current.status === 'approved') {
      return NextResponse.json(
        { success: false, message: 'This form has been approved and can no longer be edited.' },
        { status: 403 }
      );
    }

    // Stamp municipality from the user's profile (non-admins cannot override)
    if (!userCtx.isAdmin && userCtx.municipality) {
      raw.municipality = userCtx.municipality;
      raw.location_municipality = userCtx.municipality;
    }

    // Strip empty strings so typed DB columns (INTEGER, DECIMAL, DATE) don't fail
    const NUMERIC_COLS = new Set([
      'number_of_storeys', 'total_floor_area', 'building_age',
      'land_area', 'market_value', 'assessment_level', 'estimated_value',
      'cost_of_construction', 'previous_av', 'previous_mv', 'previous_area',
    ]);
    const data = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => {
        if (NUMERIC_COLS.has(k)) {
          const n = typeof v === 'string' ? parseFloat(v) : v;
          return [k, isNaN(n as number) ? null : n];
        }
        if (k === 'floor_areas' && Array.isArray(v)) {
          return [k, (v as (number | string)[]).filter(x => x !== '' && x !== null)];
        }
        return [k, v];
      })
    );

    const { data: updatedRecord, error } = await supabase
      .from('building_structures')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('PUT /api/faas/building-structures/[id] error:', error.code, error.message, error.details);
      return NextResponse.json(
        { success: false, message: error.message || 'Failed to update draft', code: error.code },
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
    console.error('PUT /api/faas/building-structures/[id] unexpected error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Server error' },
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

    const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin';

    if (!isAdmin) {
      // Non-admins can only delete their own drafts or returned forms
      const { data: record, error: fetchErr } = await supabase
        .from('building_structures')
        .select('status, created_by')
        .eq('id', id)
        .single();

      if (fetchErr || !record) {
        return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
      }
      if (!['draft', 'returned'].includes(record.status) || record.created_by !== user.id) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
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
