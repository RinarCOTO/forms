import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserContext } from '@/lib/services/user.service'
import {
  getBuildingLaooDraftVisibilityFilter,
  getHiddenDraftStatusList,
  getLandMunicipalVisibilityFilter,
  getLandMunicipalityVisibilityFilter,
  getLandOwnWorkVisibilityFilter,
  getOwnOrAssignedFilter,
  isBuildingOwnWorkOnlyRole,
  isLandMunicipalDashboardRole,
  shouldHideBuildingDrafts,
  shouldHideLandDrafts,
  shouldScopeBuildingToMunicipality,
  shouldScopeLandToMunicipality,
} from '@/lib/faas/visibility-filters'

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
  return createSupabaseAdminClient({ allowAnonFallback: true })
}

function applyBuildingVisibility(query: CountQuery, userCtx: UserContext): CountQuery {
  let scopedQuery = query

  if (isBuildingOwnWorkOnlyRole(userCtx.role)) {
    return scopedQuery.or(getOwnOrAssignedFilter(userCtx))
  }

  if (shouldScopeBuildingToMunicipality(userCtx)) {
    scopedQuery = scopedQuery.eq('municipality', userCtx.municipality)
  }

  if (shouldHideBuildingDrafts(userCtx.role)) {
    if (userCtx.role === 'laoo') {
      return scopedQuery.or(getBuildingLaooDraftVisibilityFilter(userCtx))
    }

    return scopedQuery.not('status', 'in', getHiddenDraftStatusList())
  }

  return scopedQuery
}

function applyLandVisibility(query: CountQuery, userCtx: UserContext): CountQuery {
  let scopedQuery = query

  if (isLandMunicipalDashboardRole(userCtx.role)) {
    return scopedQuery.or(getLandMunicipalVisibilityFilter(userCtx))
  }

  if (shouldScopeLandToMunicipality(userCtx)) {
    scopedQuery = scopedQuery.or(getLandMunicipalityVisibilityFilter(userCtx))
  }

  if (shouldHideLandDrafts(userCtx.role)) {
    return scopedQuery.or(getLandOwnWorkVisibilityFilter(userCtx))
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
