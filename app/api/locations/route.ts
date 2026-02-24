import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * GET /api/locations?type=province
 * GET /api/locations?type=municipality&parent=1404400000
 * GET /api/locations?type=barangay&parent=1404401000
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type   = searchParams.get('type');
    const parent = searchParams.get('parent');

    if (!type || !['province', 'municipality', 'barangay'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type must be province, municipality, or barangay' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    let query = supabase
      .from('locations')
      .select('psgc_code, name, parent_code')
      .eq('type', type)
      .order('name');

    if (parent) {
      query = query.eq('parent_code', parent);
    }

    const { data, error } = await query;

    if (error) {
      console.error('GET /api/locations error:', error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err) {
    console.error('GET /api/locations unexpected error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
