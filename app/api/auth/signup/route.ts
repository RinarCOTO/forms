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

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null,
        },
      },
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      console.error('Signup failed: No user returned');
      return NextResponse.json(
        { error: 'Signup failed' },
        { status: 400 }
      );
    }

    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user profile was created in users table
    const { error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('User profile not found in users table:', profileError);
      
      // Create user profile manually if the auth trigger failed.
      const admin = getAdminClient();
      const { error: manualError } = await admin
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName || null,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (manualError) {
        console.error('Failed to create user profile manually:', manualError);
        return NextResponse.json(
          { error: 'Account created but profile setup failed. Please contact support.' },
          { status: 201 } // Still return success because auth user was created
        );
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
