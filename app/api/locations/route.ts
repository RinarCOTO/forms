import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type LocationRow = {
  psgc_code: string;
  name: string;
  parent_code: string | null;
};

const NCR_PROVINCE_CODE = '1300000000';
const NCR_MUNICIPALITY_NAMES = new Map([
  ['1380100000', 'City of Caloocan'],
  ['1380200000', 'City of Las Pinas'],
  ['1380300000', 'City of Makati'],
  ['1380400000', 'City of Malabon'],
  ['1380500000', 'City of Mandaluyong'],
  ['1380600000', 'City of Manila'],
  ['1380700000', 'City of Marikina'],
  ['1380800000', 'City of Muntinlupa'],
  ['1380900000', 'City of Navotas'],
  ['1381000000', 'City of Paranaque'],
  ['1381100000', 'Pasay City'],
  ['1381200000', 'City of Pasig'],
  ['1381300000', 'Quezon City'],
  ['1381400000', 'City of San Juan'],
  ['1381500000', 'City of Taguig'],
  ['1381600000', 'City of Valenzuela'],
  ['1381701000', 'Pateros'],
]);

function cleanLocationRows(rows: LocationRow[], type: string, parent: string | null) {
  if (type !== 'municipality' || parent !== NCR_PROVINCE_CODE) return rows;

  return rows
    .filter(row => NCR_MUNICIPALITY_NAMES.has(row.psgc_code))
    .map(row => ({
      ...row,
      name: NCR_MUNICIPALITY_NAMES.get(row.psgc_code) ?? row.name,
    }));
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

    return NextResponse.json({
      success: true,
      data: cleanLocationRows((data ?? []) as LocationRow[], type, parent),
    });
  } catch (err) {
    console.error('GET /api/locations unexpected error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
