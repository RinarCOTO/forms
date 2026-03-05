import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient } from '../../../lib/auth'

/**
 * GET /api/notes
 * Returns notes list. Requires valid Bearer token.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyBearerToken(req.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const { data, error } = await admin
      .from('notes')
      .select('id, title, updated_at, status')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[notes-service] GET error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('[notes-service] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
