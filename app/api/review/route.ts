import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
  canReviewFaasRole,
  getSelectableReviewStatusesForRole,
  isMunicipalFaasRole,
} from '@/lib/faas/workflow';
import { getMunicipalityComparisonValues } from '@/lib/faas/municipality';
import { getLaooAssignmentsForUser } from '@/lib/laoo-assignments';

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function getMunicipalityScopeFilter(municipalities: string[]) {
  const values = [
    ...new Set(municipalities.flatMap((municipality) => getMunicipalityComparisonValues(municipality))),
  ];
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

    if (profileError || !profile || !canReviewFaasRole(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter  = searchParams.getAll('status');
    const formTypeFilter = searchParams.get('form_type'); // 'building' | 'land' | null = all
    const allowedStatuses = getSelectableReviewStatusesForRole(profile.role);
    const requestedStatuses = statusFilter.length > 0 ? statusFilter : allowedStatuses;
    const statusesToQuery = requestedStatuses.filter(status => allowedStatuses.includes(status));

    if (statusesToQuery.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const results: Record<string, unknown>[] = [];
    const isLaoo = profile.role === 'laoo';
    const laooMunicipalities = isLaoo
      ? await getLaooAssignmentsForUser(admin, authUser.id, profile.municipality)
      : [];
    const municipalityScope = isLaoo ? laooMunicipalities : profile.municipality ? [profile.municipality] : [];
    const isMunicipalScoped = isMunicipalFaasRole(profile.role) && municipalityScope.length > 0;
    const isLaooScoped = isLaoo && municipalityScope.length > 0;
    const needsMunicipalityScope = isLaoo || isMunicipalFaasRole(profile.role);

    if (needsMunicipalityScope && municipalityScope.length === 0) {
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

      if (isLaooScoped || isMunicipalScoped) q = q.or(getMunicipalityScopeFilter(municipalityScope));

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

      if (isLaooScoped || isMunicipalScoped) q = q.or(getMunicipalityScopeFilter(municipalityScope));

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
