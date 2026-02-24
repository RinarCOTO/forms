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
  console.log('POST /api/building-other-structure - Starting request');
  
  // Check environment variables
  console.log('Environment check:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    const data = await req.json();
    console.log('POST - Received data:', JSON.stringify(data, null, 2));
    
    // Check if required fields are present
    if (!data) {
      console.error('POST - No data received');
      return NextResponse.json(
        { success: false, message: 'No data provided', error: 'Empty request body' },
        { status: 400 }
      );
    }
    
    console.log('POST - Creating Supabase client...');
    const supabase = await createClient();
    
    if (!supabase) {
      console.error('POST - Failed to create Supabase client');
      return NextResponse.json(
        { success: false, message: 'Database connection failed', error: 'Supabase client creation failed' },
        { status: 500 }
      );
    }
    
    console.log('POST - Supabase client created successfully');
    
    // Test connection by checking if table exists
    try {
      console.log('POST - Testing database connection...');
      const { data: testData, error: testError } = await supabase
        .from('building_structures')
        .select('count(*)')
        .limit(1);
      
      console.log('POST - Connection test result:', { testData, testError });
      
      if (testError) {
        console.error('POST - Database connection test failed:', testError);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Database connection test failed', 
            error: testError.message,
            details: testError
          },
          { status: 500 }
        );
      }
    } catch (connError) {
      console.error('POST - Connection test threw error:', connError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database connection failed', 
          error: connError instanceof Error ? connError.message : String(connError)
        },
        { status: 500 }
      );
    }
    
    console.log('POST - Inserting into building_structures table...');

    // Stamp municipality from the authenticated user's profile
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const admin = getAdminClient();
        const { data: profile } = await admin
          .from('users')
          .select('municipality, role')
          .eq('id', authUser.id)
          .single();
        if (profile?.municipality && !['admin', 'super_admin'].includes(profile.role)) {
          data.municipality = profile.municipality;
        }
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

    console.log('POST - Supabase response:', { newRecord, error });

    if (error) {
      console.error('POST - Supabase error creating draft:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to create draft in database', 
          error: error.message,
          details: error
        },
        { status: 500 }
      );
    }

    if (!newRecord) {
      console.error('POST - No record returned from Supabase');
      return NextResponse.json(
        { 
          success: false, 
          message: 'No record created', 
          error: 'Supabase returned no data'
        },
        { status: 500 }
      );
    }

    console.log('POST - Successfully created draft:', newRecord);
    return NextResponse.json({ success: true, data: newRecord });
  } catch (error) {
    console.error('POST - Caught error in /api/building-other-structure:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Server error occurred', 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
