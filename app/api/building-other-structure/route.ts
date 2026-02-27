import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'No data provided' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify authentication before doing anything
    const { data: { user: requestUser }, error: requestUserError } = await supabase.auth.getUser();
    if (requestUserError || !requestUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Stamp municipality from the authenticated user's profile
    try {
      const admin = getAdminClient();
      const { data: profile } = await admin
        .from('users')
        .select('municipality, role')
        .eq('id', requestUser.id)
        .single();
      if (profile?.municipality && !['admin', 'super_admin'].includes(profile.role)) {
        data.municipality = profile.municipality;
      }
    } catch {
      // Non-fatal: proceed without municipality if lookup fails
    }

    // Insert into building_structures table
    const { data: newRecord, error } = await supabase
      .from('building_structures')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating building structure draft:', error.code);
      return NextResponse.json(
        { success: false, message: 'Failed to create draft' },
        { status: 500 }
      );
    }

    if (!newRecord) {
      return NextResponse.json(
        { success: false, message: 'No record created' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: newRecord });
  } catch (error) {
    console.error('Error in POST /api/building-other-structure:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { success: false, message: 'Server error occurred' },
      { status: 500 }
    );
  }
}
