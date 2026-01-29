import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('=== Supabase Connection Test ===');
    console.log('URL:', supabaseUrl);
    console.log('Service Key:', supabaseServiceKey ? `Set (${supabaseServiceKey.length} chars)` : 'NOT SET');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Configuration missing',
        url: supabaseUrl ? 'Set' : 'Missing',
        key: supabaseServiceKey ? 'Set' : 'Missing'
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Test 1: List tables
    console.log('Test 1: Attempting to list tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    console.log('Tables result:', { tables, error: tablesError });
    
    // Test 2: Try to query building_structures
    console.log('Test 2: Attempting to query building_structures...');
    const { data, error, count } = await supabase
      .from('building_structures')
      .select('*', { count: 'exact' })
      .limit(1)
    
    console.log('Query result:', { data, error, count });
    
    // Test 3: Check connection
    console.log('Test 3: Connection check complete');
    
    return NextResponse.json({
      success: !error,
      config: {
        url: supabaseUrl,
        keyLength: supabaseServiceKey.length
      },
      tests: {
        tables: {
          success: !tablesError,
          error: tablesError?.message,
          data: tables
        },
        building_structures: {
          success: !error,
          error: error?.message,
          code: error?.code,
          count: count,
          sample: data?.[0]
        }
      }
    })
    
  } catch (error: any) {
    console.error('Test failed:', error);
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
