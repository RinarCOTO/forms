import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const REVIEW_ROLES = ['municipal_tax_mapper', 'municipal_assessor', 'laoo', 'assistant_provincial_assessor', 'provincial_assessor', 'admin', 'super_admin'];
const MUNICIPAL_ROLES = ['municipal_tax_mapper', 'municipal_assessor'];
const LAOO_ROLES = ['laoo'];
const PROVINCIAL_ROLES = ['assistant_provincial_assessor', 'provincial_assessor'];
const ADMIN_ROLES = ['admin', 'super_admin'];
const ALL_REVIEW_STATUSES = ['submitted', 'municipal_signed', 'laoo_approved', 'approved', 'returned', 'returned_to_municipal'];
const MUNICIPALITY_LABELS: Record<string, string> = {
  barlig: 'Barlig',
  bauko: 'Bauko',
  besao: 'Besao',
  bontoc: 'Bontoc',
  natonin: 'Natonin',
  paracellis: 'Paracellis',
  sabangan: 'Sabangan',
  sagada: 'Sagada',
  sadanga: 'Sadanga',
  tadian: 'Tadian',
};

function getAllowedStatusesForRole(role: string) {
  if (ADMIN_ROLES.includes(role)) return ALL_REVIEW_STATUSES;
  if (MUNICIPAL_ROLES.includes(role)) return ['submitted', 'returned_to_municipal'];
  if (LAOO_ROLES.includes(role)) return ['municipal_signed'];
  if (PROVINCIAL_ROLES.includes(role)) return ['laoo_approved'];
  return [];
}

function getMunicipalityScopeFilter(municipality: string) {
  const label = MUNICIPALITY_LABELS[municipality.toLowerCase()];
  const values = [...new Set([municipality, municipality.toLowerCase(), label].filter(Boolean))];
  return values
    .flatMap(value => [`location_municipality.eq.${value}`, `municipality.eq.${value}`])
    .join(',');
}

export async function GET(request: NextRequest) {
  try {
    const sessionClient = await createClient();
    const { data: { user: authUser }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdmin();

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('role, municipality')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile || !REVIEW_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter  = searchParams.getAll('status');
    const formTypeFilter = searchParams.get('form_type'); // 'building' | 'land' | null = all
    const allowedStatuses = getAllowedStatusesForRole(profile.role);
    const requestedStatuses = statusFilter.length > 0 ? statusFilter : allowedStatuses;
    const statusesToQuery = requestedStatuses.filter(status => allowedStatuses.includes(status));

    if (statusesToQuery.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const results: Record<string, unknown>[] = [];
    const isLaoo = profile.role === 'laoo';
    const isMunicipalScoped = MUNICIPAL_ROLES.includes(profile.role) && !!profile.municipality;
    const isLaooScoped = isLaoo && !!profile.municipality;
    const needsMunicipalityScope = isLaoo || MUNICIPAL_ROLES.includes(profile.role);

    if (needsMunicipalityScope && !profile.municipality) {
      return NextResponse.json({ success: true, data: [] });
    }

    // ── Building Structures ────────────────────────────────────────────────────
    if (!formTypeFilter || formTypeFilter === 'building') {
      let q = admin
        .from('building_structures')
        .select('id, owner_name, location_municipality, location_barangay, status, submitted_at, updated_at, laoo_reviewer_id')
        .in('status', statusesToQuery)
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });

      if (isLaooScoped || isMunicipalScoped) q = q.or(getMunicipalityScopeFilter(profile.municipality));

      const { data } = await q;
      if (data) {
        results.push(...data.map(r => ({ ...r, form_type: 'building', form_label: 'Building & Structure' })));
      }
    }

    // ── Land Improvements ──────────────────────────────────────────────────────
    if (!formTypeFilter || formTypeFilter === 'land') {
      let q = admin
        .from('land_improvements')
        .select('id, owner_name, location_municipality, location_barangay, status, submitted_at, updated_at, laoo_reviewer_id')
        .in('status', statusesToQuery)
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });

      if (isLaooScoped || isMunicipalScoped) q = q.or(getMunicipalityScopeFilter(profile.municipality));

      const { data } = await q;
      if (data) {
        results.push(...data.map(r => ({ ...r, form_type: 'land', form_label: 'Land Improvement' })));
      }
    }

    // Sort combined list: newest submitted first.
    results.sort((a, b) => {
      const submittedA = a.submitted_at ? new Date(a.submitted_at as string).getTime() : 0;
      const submittedB = b.submitted_at ? new Date(b.submitted_at as string).getTime() : 0;
      if (submittedB !== submittedA) return submittedB - submittedA;
      const updatedA = a.updated_at ? new Date(a.updated_at as string).getTime() : 0;
      const updatedB = b.updated_at ? new Date(b.updated_at as string).getTime() : 0;
      return updatedB - updatedA;
    });

    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    console.error('GET /api/review-queue:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
