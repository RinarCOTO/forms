import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    // 1. Require an authenticated super_admin caller
    const supabase = await createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: callerProfile } = await supabaseAdmin
      .from('users').select('role').eq('id', authUser.id).single();

    if (!callerProfile || callerProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: super_admin role required' }, { status: 403 });
    }
    
    // Check current columns in building_structures table
    const { data: columns, error: columnError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'building_structures')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    // Test if we can query the table with service role
    const { data: testData, error: testError } = await supabaseAdmin
      .from('building_structures')
      .select('id')
      .limit(1);

    // List of required columns
    const requiredColumns = [
      'owner_province_code',
      'owner_municipality_code', 
      'owner_barangay_code',
      'admin_care_of',
      'admin_province_code',
      'admin_municipality_code',
      'admin_barangay_code', 
      'property_address',
      'property_province_code',
      'property_municipality_code',
      'property_barangay_code'
    ];

    const existingColumns = columns?.map(col => col.column_name) || [];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    return NextResponse.json({
      success: true,
      message: 'Database schema analysis complete',
      results: {
        existingColumns,
        missingColumns,
        totalColumns: columns?.length || 0,
        permissionTest: testError ? 'FAILED' : 'PASSED',
        permissionError: testError,
        sqlToRun: missingColumns.length > 0 ? `
-- Run this SQL in your Supabase SQL Editor:
ALTER TABLE public.building_structures 
${missingColumns.map(col => {
  if (col.includes('address')) return `ADD COLUMN IF NOT EXISTS ${col} TEXT`;
  if (col === 'admin_care_of') return `ADD COLUMN IF NOT EXISTS ${col} VARCHAR(255)`;
  return `ADD COLUMN IF NOT EXISTS ${col} VARCHAR(10)`;
}).join(',\n')};

-- Fix permissions:
GRANT ALL ON TABLE public.building_structures TO authenticated;
GRANT ALL ON TABLE public.building_structures TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.building_structures_id_seq TO authenticated, service_role;
ALTER TABLE public.building_structures DISABLE ROW LEVEL SECURITY;
        ` : 'No missing columns - schema is up to date!'
      }
    });

  } catch (error) {
    console.error('Database schema check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check database schema'
    }, { status: 500 });
  }
}