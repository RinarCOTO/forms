import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  console.log('=== Database Test API ===');
  
  try {
    // Use admin client to bypass permissions
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

    console.log('Testing database connection...');
    
    // Test 1: Check if building_structures table exists
    const { data: tables, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'building_structures');

    console.log('Table check:', { tables, tableError });

    if (tableError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to check tables',
        details: tableError
      });
    }

    // Test 2: Check columns in building_structures
    const { data: columns, error: columnError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'building_structures')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    console.log('Column check:', { columns, columnError });

    // Test 3: Try to insert a simple record
    const testData = {
      owner_name: 'Test Owner',
      status: 'draft'
    };

    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('building_structures')
      .insert(testData)
      .select()
      .single();

    console.log('Insert test:', { insertResult, insertError });

    return NextResponse.json({
      success: true,
      tests: {
        tableExists: !tableError && tables?.length > 0,
        columnsFound: columns?.length || 0,
        insertWorked: !insertError,
        insertResult,
        insertError
      },
      columns: columns,
      environment: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}