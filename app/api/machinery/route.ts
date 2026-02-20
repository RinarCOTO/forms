import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () =>
  createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: 'public' } }
  );

export async function GET() {
  console.log('GET /api/machinery - Starting request');

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('machinery')
      .select('id, owner_name, updated_at, status')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('GET - Error fetching machinery:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch machinery', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('GET - Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log('POST /api/machinery - Starting request');

  try {
    const data = await req.json();

    if (!data) {
      return NextResponse.json(
        { success: false, message: 'No data provided', error: 'Empty request body' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Database connection failed', error: 'Supabase client creation failed' },
        { status: 500 }
      );
    }

    const { data: newRecord, error } = await supabase
      .from('machinery')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('POST - Supabase error creating record:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to create record', error: error.message, details: error },
        { status: 500 }
      );
    }

    if (!newRecord) {
      return NextResponse.json(
        { success: false, message: 'No record created', error: 'Supabase returned no data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: newRecord });
  } catch (error) {
    console.error('POST - Error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
