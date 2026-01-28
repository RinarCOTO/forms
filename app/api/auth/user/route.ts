import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user from auth
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: authError?.message || 'Unauthorized', user: null },
        { status: 401 }
      );
    }

    // Fetch user profile from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      // If profile doesn't exist, return auth user data
      return NextResponse.json(
        {
          user: {
            id: authUser.id,
            email: authUser.email,
            user_metadata: authUser.user_metadata,
            created_at: authUser.created_at,
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { user: userProfile },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', user: null },
      { status: 500 }
    );
  }
}

// PATCH - Update current user profile
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { full_name, department, position, phone } = body;

    // Update user profile (users can't change their own role or is_active status)
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update({
        full_name,
        department,
        position,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { user: updatedProfile },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

