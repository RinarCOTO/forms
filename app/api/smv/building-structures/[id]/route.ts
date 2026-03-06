import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCurrentUserContext } from '@/lib/services/user.service'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false }, db: { schema: 'public' } }
  )
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) return NextResponse.json({ success: false, message: 'No ID provided' }, { status: 400 })

    const userCtx = await getCurrentUserContext()
    if (!userCtx) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    if (!userCtx.isAdmin) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const admin = getAdminClient()
    const { data, error } = await admin
      .from('building_structures')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 })

    return NextResponse.json({ success: true, message: 'Deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
