import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getCurrentUserContext } from '@/lib/services/user.service'

const PROVINCIAL_ROLES = ['laoo', 'assistant_provincial_assessor', 'provincial_assessor']
const HIDE_BUILDING_DRAFTS_ROLES = ['municipal_assessor', 'laoo', 'provincial_assessor', 'assistant_provincial_assessor']
const HIDE_LAND_DRAFTS_ROLES = ['laoo', 'provincial_assessor', 'assistant_provincial_assessor']
const LAND_MUNICIPAL_DASHBOARD_ROLES = ['municipal_tax_mapper', 'municipal_assessor']
const LAND_OWN_WORK_STATUSES = ['draft', 'returned', 'returned_to_municipal']
const LAND_HIDDEN_REVIEW_STATUSES = ['draft', 'returned']

type UserContext = NonNullable<Awaited<ReturnType<typeof getCurrentUserContext>>>
type CountResult = { count: number | null }
type CountQuery = {
  eq(column: string, value: unknown): CountQuery
  not(column: string, operator: string, value: string): CountQuery
  or(filters: string): CountQuery
  then<TResult1 = CountResult, TResult2 = never>(
    onfulfilled?: ((value: CountResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2>
}

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function applyBuildingVisibility(query: CountQuery, userCtx: UserContext): CountQuery {
  let scopedQuery = query

  if (userCtx.role === 'municipal_tax_mapper') {
    return scopedQuery.or(`created_by.eq.${userCtx.userId},assigned_to.eq.${userCtx.userId}`)
  }

  if (!userCtx.isAdmin && !PROVINCIAL_ROLES.includes(userCtx.role) && userCtx.municipality) {
    scopedQuery = scopedQuery.eq('municipality', userCtx.municipality)
  }

  if (HIDE_BUILDING_DRAFTS_ROLES.includes(userCtx.role)) {
    if (userCtx.role === 'laoo') {
      return scopedQuery.or(`and(status.neq.draft,status.neq.returned),and(status.eq.draft,created_by.eq.${userCtx.userId})`)
    }

    return scopedQuery.not('status', 'in', '("draft","returned")')
  }

  return scopedQuery
}

function applyLandVisibility(query: CountQuery, userCtx: UserContext): CountQuery {
  let scopedQuery = query

  if (LAND_MUNICIPAL_DASHBOARD_ROLES.includes(userCtx.role)) {
    return userCtx.municipality
      ? scopedQuery.or(`municipality.eq.${userCtx.municipality},location_municipality.ilike.${userCtx.municipality},created_by.eq.${userCtx.userId},assigned_to.eq.${userCtx.userId}`)
      : scopedQuery.or(`created_by.eq.${userCtx.userId},assigned_to.eq.${userCtx.userId}`)
  }

  if (!userCtx.isAdmin && !PROVINCIAL_ROLES.includes(userCtx.role) && userCtx.municipality) {
    scopedQuery = scopedQuery.or(`municipality.eq.${userCtx.municipality},location_municipality.ilike.${userCtx.municipality}`)
  }

  if (HIDE_LAND_DRAFTS_ROLES.includes(userCtx.role)) {
    const ownWorkVisibilityFilter =
      `status.not.in.(${LAND_HIDDEN_REVIEW_STATUSES.join(',')}),and(status.in.(${LAND_OWN_WORK_STATUSES.join(',')}),created_by.eq.${userCtx.userId})`

    return scopedQuery.or(ownWorkVisibilityFilter)
  }

  return scopedQuery
}

function applyMunicipalityVisibility(
  query: CountQuery,
  userCtx: UserContext,
): CountQuery {
  if (!userCtx.isAdmin && userCtx.municipality) {
    return query.eq('municipality', userCtx.municipality)
  }

  return query
}

export async function GET() {
  try {
    const userCtx = await getCurrentUserContext()
    if (!userCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()

    const buildingQuery = admin.from('building_structures').select('id', { count: 'exact', head: true }) as unknown as CountQuery
    const landQuery     = admin.from('land_improvements').select('id', { count: 'exact', head: true }) as unknown as CountQuery
    const machineryQuery = admin.from('machinery').select('id', { count: 'exact', head: true }) as unknown as CountQuery
    const notesQuery    = admin.from('notes').select('id', { count: 'exact', head: true }) as unknown as CountQuery

    const [buildingCount, landCount, machineryCount, notesCount] = await Promise.all([
      applyBuildingVisibility(buildingQuery, userCtx),
      applyLandVisibility(landQuery, userCtx),
      applyMunicipalityVisibility(machineryQuery, userCtx),
      notesQuery, // notes are not municipality-scoped
    ])

    return NextResponse.json({
      'building-structure': buildingCount.count || 0,
      'land-improvements':  landCount.count || 0,
      'machinery':          machineryCount.count || 0,
      'notes':              notesCount.count || 0,
    })
  } catch (error) {
    console.error('Error fetching form counts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
