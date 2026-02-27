import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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

    // Check if we have service role key, if not, try with regular client first
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Try with regular client first
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!profileError && userProfile) {
        return NextResponse.json({
          user: {
            id: authUser.id,
            email: authUser.email,
            role: userProfile.role || 'user',
            full_name: userProfile.full_name || authUser.user_metadata?.full_name,
            user_metadata: authUser.user_metadata,
            profile: userProfile,
          },
        });
      }
      
      return NextResponse.json(
        { 
          error: 'Service role key not configured. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.',
          details: profileError
        },
        { status: 500 }
      );
    }

    // Use admin client to bypass RLS and fetch user profile
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Fetch user profile from users table using admin client
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      
      // Create user profile if it doesn't exist using admin client
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || null,
          role: 'user', // Default role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create user profile:', createError);
        // Still return auth user data but with default role
        return NextResponse.json(
          {
            user: {
              id: authUser.id,
              email: authUser.email,
              user_metadata: authUser.user_metadata,
              created_at: authUser.created_at,
              role: 'user', // Default role
              full_name: authUser.user_metadata?.full_name || null
            },
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { user: newProfile },
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

