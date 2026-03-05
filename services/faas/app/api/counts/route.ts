import { NextRequest, NextResponse } from 'next/server'
import { verifyBearerToken, getAdminClient, getUserContext } from '../../../lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyBearerToken(request.headers.get('authorization'))
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userCtx = await getUserContext(user.id)
    if (!userCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = getAdminClient()
    const filterByMunicipality = !userCtx.isAdmin && userCtx.municipality

    const buildingQuery = admin.from('building_structures').select('id', { count: 'exact', head: true })
    const landQuery     = admin.from('land_improvements').select('id', { count: 'exact', head: true })
    const machineryQuery = admin.from('machinery').select('id', { count: 'exact', head: true })
    const notesQuery    = admin.from('notes').select('id', { count: 'exact', head: true })

    const [buildingCount, landCount, machineryCount, notesCount] = await Promise.all([
      filterByMunicipality ? buildingQuery.eq('municipality', userCtx.municipality!) : buildingQuery,
      filterByMunicipality ? landQuery.eq('municipality', userCtx.municipality!) : landQuery,
      filterByMunicipality ? machineryQuery.eq('municipality', userCtx.municipality!) : machineryQuery,
      notesQuery,
    ])

    return NextResponse.json({
      'building-structure': buildingCount.count || 0,
      'land-improvements':  landCount.count || 0,
      'machinery':          machineryCount.count || 0,
      'notes':              notesCount.count || 0,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
