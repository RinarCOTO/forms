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

const REVIEW_ROLES = ['laoo', 'assistant_provincial_assessor', 'provincial_assessor', 'admin', 'super_admin'];

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
    const statusFilter  = searchParams.get('status');
    const formTypeFilter = searchParams.get('form_type'); // 'building' | 'land' | null = all
    const statusesToQuery = statusFilter ? [statusFilter] : ['submitted', 'under_review'];

    const results: Record<string, unknown>[] = [];
    const isLaooScoped = profile.role === 'laoo' && !!profile.municipality;

    // ── Building Structures ────────────────────────────────────────────────────
    if (!formTypeFilter || formTypeFilter === 'building') {
      let q = admin
        .from('building_structures')
        .select('id, owner_name, location_municipality, location_barangay, status, submitted_at, updated_at, laoo_reviewer_id')
        .in('status', statusesToQuery)
        .order('submitted_at', { ascending: true });

      if (isLaooScoped) q = q.eq('location_municipality', profile.municipality);

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
        .order('submitted_at', { ascending: true });

      if (isLaooScoped) q = q.eq('location_municipality', profile.municipality);

      const { data } = await q;
      if (data) {
        results.push(...data.map(r => ({ ...r, form_type: 'land', form_label: 'Land Improvement' })));
      }
    }

    // Sort combined list: oldest submitted first
    results.sort((a, b) => {
      const tA = a.submitted_at ? new Date(a.submitted_at as string).getTime() : 0;
      const tB = b.submitted_at ? new Date(b.submitted_at as string).getTime() : 0;
      return tA - tB;
    });

    return NextResponse.json({ success: true, data: results });
  } catch (err) {
    console.error('GET /api/review-queue:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
