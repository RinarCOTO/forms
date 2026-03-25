import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = request.nextUrl.searchParams.get('role');
  const userId = request.nextUrl.searchParams.get('id');

  // role is required unless looking up a specific user by id
  if (!role && !userId) return NextResponse.json({ error: 'role or id param required' }, { status: 400 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const municipality = request.nextUrl.searchParams.get('municipality');

  let query = admin
    .from('users')
    .select('id, full_name, role, municipality, position');

  if (role) {
    const roles = role.split(',').map((r: string) => r.trim()).filter(Boolean);
    query = roles.length === 1 ? query.eq('role', roles[0]) : query.in('role', roles);
  }

  if (municipality) {
    query = query.ilike('municipality', municipality);
  }

  if (userId) {
    query = query.eq('id', userId);
  }

  const { data: users, error: dbError } = await query;

  if (dbError) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });

  return NextResponse.json({ users });
}
