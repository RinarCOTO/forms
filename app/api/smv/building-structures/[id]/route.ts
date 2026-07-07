import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserContext } from '@/lib/services/user.service'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await request.text().catch(() => '')
  await context.params.catch(() => ({ id: '' }))

  const userCtx = await getCurrentUserContext()
  if (!userCtx) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(
    {
      success: false,
      message: 'SMV building records are managed through source tables, not RPFAAS submissions.',
    },
    { status: 410 },
  )
}
