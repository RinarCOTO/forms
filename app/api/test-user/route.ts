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

    console.log("Auth user:", authUser);
    console.log("Auth error:", authError);

    if (authError || !authUser) {
      return NextResponse.json(
        { 
          error: authError?.message || 'Unauthorized',
          authUser: null,
          userProfile: null
        },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS
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

    console.log("User profile:", userProfile);
    console.log("Profile error:", profileError);

    return NextResponse.json(
      {
        authUser: {
          id: authUser.id,
          email: authUser.email,
          user_metadata: authUser.user_metadata,
        },
        userProfile,
        profileError: profileError?.message || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Test user error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}