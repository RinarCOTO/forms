import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient } from '../../../../../lib/auth'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params)
    const id = params.id

    const authUser = await verifyBearerToken(req.headers.get('authorization'))
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()

    const { data, error } = await admin
      .from('form_comments')
      .select('id, field_name, comment_text, suggested_value, author_id, author_role, parent_id, is_resolved, created_at, updated_at')
      .eq('form_type', 'building_structures')
      .eq('form_id', parseInt(id))
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const authorIds = [...new Set((data ?? []).map(c => c.author_id))]
    let authorMap: Record<string, string> = {}
    if (authorIds.length > 0) {
      const { data: users } = await admin
        .from('users')
        .select('id, full_name, email')
        .in('id', authorIds)
      if (users) {
        authorMap = Object.fromEntries(users.map(u => [u.id, u.full_name ?? u.email ?? u.id]))
      }
    }

    const enriched = (data ?? []).map(c => ({ ...c, author_name: authorMap[c.author_id] ?? c.author_id }))

    return NextResponse.json({ success: true, data: enriched })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params)
    const id = params.id

    const authUser = await verifyBearerToken(req.headers.get('authorization'))
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) return NextResponse.json({ error: 'User profile not found' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { field_name, comment_text, suggested_value, parent_id } = body as {
      field_name?: string
      comment_text: string
      suggested_value?: string
      parent_id?: string
    }

    if (!comment_text?.trim()) return NextResponse.json({ error: 'comment_text is required' }, { status: 400 })

    const COMMENT_ROLES = ['laoo', 'tax_mapper', 'municipal_tax_mapper', 'admin', 'super_admin',
      'assistant_provincial_assessor', 'provincial_assessor']
    const authorRole = COMMENT_ROLES.includes(profile.role) ? profile.role : 'admin'

    const { data: inserted, error: insertError } = await admin
      .from('form_comments')
      .insert({
        form_type: 'building_structures',
        form_id: parseInt(id),
        field_name: field_name ?? null,
        comment_text: comment_text.trim(),
        suggested_value: suggested_value ?? null,
        author_id: authUser.id,
        author_role: authorRole,
        parent_id: parent_id ?? null,
      })
      .select()
      .single()

    if (insertError || !inserted) {
      return NextResponse.json({ error: insertError?.message ?? 'Insert failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: inserted }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
