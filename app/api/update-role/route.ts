import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Use service role to bypass RLS for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // First, get the current user from regular client to verify identity
    const supabase = await import('@/lib/supabase/server').then(m => m.createClient());
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Updating role for user:', authUser.email);

    // Update the current user's role to super_admin using admin client
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        role: 'super_admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', authUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update role: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log('User role updated to super_admin:', updatedUser);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Role updated to super_admin successfully',
        user: updatedUser,
        // Add a timestamp to help with cache busting
        timestamp: Date.now()
      },
      { 
        status: 200,
        headers: {
          // Prevent caching of this response
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}