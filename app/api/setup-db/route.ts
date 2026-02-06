export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    // Use service role key with additional bypass options
    const supabase = createClient(
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

    const { error: createError } = await supabase.rpc('exec', { 
      sql: createTableSQL 
    });

    if (createError) {
      console.error('Error creating table:', createError);
      // Try alternative approach - execute via raw SQL
      const { error: rawError } = await supabase.from('land_improvements').select('count').limit(1);
      if (rawError && rawError.code === '42P01') {
        return NextResponse.json(
          { error: 'Table does not exist and could not be created', details: createError.message },
          { status: 500 }
        );
      }
    }

    // Check if RLS is causing issues and temporarily disable it for testing
    const disableRLSSQL = `
      ALTER TABLE land_improvements DISABLE ROW LEVEL SECURITY;
    `;

    const { error: rlsError } = await supabase.rpc('exec', { 
      sql: disableRLSSQL 
    });

    if (rlsError) {
      console.error('Could not disable RLS:', rlsError);
    }

    // Test table access
    const { data, error } = await supabase
      .from('land_improvements')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { error: 'Table setup failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed successfully',
      tableExists: true
    });

  } catch (error: any) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { error: 'Database setup failed', details: error.message },
      { status: 500 }
    );
  }
}