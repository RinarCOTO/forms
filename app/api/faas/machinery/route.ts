import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCurrentUserContext } from '@/lib/services/user.service'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const userCtx = await getCurrentUserContext()
    if (!userCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()
    const raw = await request.json()

    if (!userCtx.isAdmin && userCtx.municipality) {
      raw.municipality = userCtx.municipality
    }
    raw.created_by = userCtx.userId

    const body = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== '' && v !== undefined)
    )

    const { data, error } = await admin
      .from('machinery')
      .insert([body])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const userCtx = await getCurrentUserContext()
    if (!userCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()
    let query = admin
      .from('machinery')
      .select('id, owner_name, updated_at, approved_at, status, municipality, created_by')
      .order('updated_at', { ascending: false })

    if (!userCtx.isAdmin && userCtx.municipality) {
      query = query.eq('municipality', userCtx.municipality)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching machinery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
