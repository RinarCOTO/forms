import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserContext } from '@/lib/services/user.service'

async function requireUser() {
  const userCtx = await getCurrentUserContext()
  if (!userCtx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function GET() {
  const unauthorized = await requireUser()
  if (unauthorized) return unauthorized

  return NextResponse.json({ data: [], total: 0 })
}

export async function POST(request: NextRequest) {
  await request.text().catch(() => '')

  const unauthorized = await requireUser()
  if (unauthorized) return unauthorized

  return NextResponse.json(
    { error: 'SMV building records are managed through source tables, not RPFAAS submissions.' },
    { status: 410 },
  )
}
