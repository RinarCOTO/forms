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

// GET - Fetch all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role via admin client to bypass RLS
    const admin = getAdminClient();
    const { data: currentUser } = await admin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all users via admin client (bypasses RLS)
    const { data: users, error: usersError } = await admin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Fetch users error:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// POST - Create new user (Admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role via admin client
    const admin = getAdminClient();
    const { data: currentUser } = await admin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (!currentUser || !['admin', 'super_admin'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, full_name, role, municipality, department, position, phone } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Create auth user via admin client
    const { data: newAuthUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || email },
    });

    if (createError || !newAuthUser.user) {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    // Update profile with extra fields via admin client
    if (role || municipality || department || position || phone || full_name) {
      await admin
        .from('users')
        .update({ role: role || 'user', municipality: municipality || null, department, position, phone, full_name })
        .eq('id', newAuthUser.user.id);
    }

    // Fetch the created profile
    const { data: userProfile } = await admin
      .from('users')
      .select('*')
      .eq('id', newAuthUser.user.id)
      .single();

    return NextResponse.json({ user: userProfile }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
