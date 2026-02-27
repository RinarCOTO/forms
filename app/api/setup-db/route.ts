export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    // 1. Require an authenticated super_admin caller
    const supabase = await createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: callerProfile } = await adminCheck
      .from('users').select('role').eq('id', authUser.id).single();

    if (!callerProfile || callerProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: super_admin role required' }, { status: 403 });
    }

    // 2. Use service role key with additional bypass options
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create the land_improvements table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS land_improvements (
        id SERIAL PRIMARY KEY,
        
        -- Property Information
        arp_no VARCHAR(50),
        pin VARCHAR(50),
        owner_name VARCHAR(255),
        owner_address TEXT,
        
        -- Improvement Details
        improvement_type VARCHAR(100),
        description TEXT,
        area DECIMAL(10, 2),
        unit_of_measure VARCHAR(20),
        
        -- Assessment
        market_value DECIMAL(15, 2),
        assessment_level DECIMAL(5, 2),
        assessed_value DECIMAL(15, 2),
        
        -- Metadata
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID,
        updated_by UUID
      );
    `;

    const { error: createError } = await adminSupabase.rpc('exec', { 
      sql: createTableSQL 
    });

    if (createError) {
      console.error('Error creating table:', createError);
      // Try alternative approach - execute via raw SQL
      const { error: rawError } = await adminSupabase.from('land_improvements').select('count').limit(1);
      if (rawError && rawError.code === '42P01') {
        return NextResponse.json(
          { error: 'Table does not exist and could not be created' },
          { status: 500 }
        );
      }
    }

    // Test table access
    const { data, error } = await adminSupabase
      .from('land_improvements')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { error: 'Table setup failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed successfully',
      tableExists: true
    });

  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { error: 'Database setup failed' },
      { status: 500 }
    );
  }
}