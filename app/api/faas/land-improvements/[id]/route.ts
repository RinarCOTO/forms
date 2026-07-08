export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserContext } from '@/lib/services/user.service'
import { canAccessFaasRecord, FAAS_ACCESS_SELECT, parsePositiveIntegerId } from '@/lib/faas/access-control'
import { sanitizeFaasUpdatePayload } from '@/lib/faas/update-payload'
import { z } from 'zod'

const numericField = z.union([z.number(), z.string()]).nullish()

const LandImprovementUpdateSchema = z.object({
  status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'returned', 'rejected']).optional(),
  created_by: z.string().max(255).optional(),
  updated_by: z.string().max(255).optional(),

  // step 1 — property identification
  td_no: z.string().max(50).optional(),
  arp_no: z.string().max(50).optional(),
  pin: z.string().max(50).optional(),
  transaction_code: z.string().optional(),
  oct_tct_cloa_no: z.string().nullish(),
  survey_no: z.string().optional(),
  lot_no: z.string().optional(),
  blk: z.string().optional(),

  // step 1 — owner / admin
  owner_name: z.string().max(255).optional(),
  owner_address: z.string().optional(),
  owner_province_code: z.string().optional(),
  owner_municipality_code: z.string().optional(),
  owner_barangay_code: z.string().optional(),
  admin_care_of: z.string().optional(),
  admin_address: z.string().optional(),
  admin_province_code: z.string().optional(),
  admin_municipality_code: z.string().optional(),
  admin_barangay_code: z.string().optional(),

  // step 1 — property location
  property_address: z.string().optional(),
  property_province_code: z.string().optional(),
  property_municipality_code: z.string().optional(),
  property_barangay_code: z.string().optional(),
  location_province: z.string().optional(),
  location_municipality: z.string().optional(),
  location_barangay: z.string().optional(),
  municipality: z.string().optional(),

  // step 2 — boundaries
  north_property: z.string().optional(),
  east_property: z.string().optional(),
  south_property: z.string().optional(),
  west_property: z.string().optional(),

  // step 3 — appraisal
  classification: z.string().optional(),
  sub_classification: z.string().optional(),
  land_class: z.string().optional(),
  land_area: numericField,
  unit_value: numericField,
  base_market_value: numericField,

  // step 4 — improvements / adjustments
  selected_deductions: z.array(z.union([z.string(), z.number()])).optional(),
  improvement_kind: z.union([z.array(z.union([z.string(), z.number()])), z.string()]).optional(),
  quantities: z.array(z.union([z.number(), z.string()])).optional(),
  overall_comments: z.string().optional(),
  additional_percentage_choice: z.string().optional(),
  additional_percentage_value: numericField,
  additional_percentage_areas: z.array(z.union([z.number(), z.string()])).optional(),
  additional_flat_rate_choice: z.string().optional(),
  additional_flat_rate_value: numericField,
  additional_flat_rate_areas: z.array(z.union([z.number(), z.string()])).optional(),
  market_value: numericField,
  land_market_value: numericField,
  improvement_market_value: numericField,
  improvement_assessment_level: numericField,

  // step 5 — assessment
  actual_use: z.string().optional(),
  tax_status: z.enum(['taxable', 'exempt']).optional(),
  assessment_level: numericField,
  assessed_value: numericField,
  amount_in_words: z.string().optional(),
  effectivity_of_assessment: z.string().optional(),

  // step 1 — previous declaration
  previous_td_no: z.string().nullish(),
  previous_owner: z.string().nullish(),
  previous_av: numericField,
  previous_mv: numericField,
  previous_area: numericField,

  // reviewer / approver IDs
  appraised_by: z.string().nullish(),
  municipal_reviewer_id: z.string().nullish(),
  provincial_reviewer_id: z.string().nullish(),
  memoranda: z.string().nullish(),

  // legacy / misc
  improvement_type: z.string().max(100).optional(),
  description: z.string().optional(),
  area: numericField,
  unit_of_measure: z.string().max(20).optional(),
})

const getSupabaseAdmin = () => createSupabaseAdminClient()

// GET: Fetch single land improvement record by ID
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userCtx = await getCurrentUserContext()
    if (!userCtx) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { id } = await params
    const recordId = parsePositiveIntegerId(id)
    if (!recordId) {
      return NextResponse.json({ success: false, error: 'Invalid ID provided' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('land_improvements')
      .select('*')
      .eq('id', recordId)
      .single()
    
    if (error) {
      console.error('Error fetching land improvement:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch land improvement', details: error.message },
        { status: 500 }
      )
    }
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Land improvement not found' },
        { status: 404 }
      )
    }

    if (!canAccessFaasRecord(userCtx, data)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update existing land improvement record
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userCtx = await getCurrentUserContext()
    if (!userCtx) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { id } = await params
    const recordId = parsePositiveIntegerId(id)
    if (!recordId) {
      return NextResponse.json({ success: false, error: 'Invalid ID provided' }, { status: 400 })
    }
    const body = await request.json()

    // Block updates on approved forms — fetch current status first
    const { data: current, error: fetchErr } = await supabase
      .from('land_improvements')
      .select(FAAS_ACCESS_SELECT)
      .eq('id', recordId)
      .single()
    if (fetchErr || !current) {
      return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 })
    }
    if (!canAccessFaasRecord(userCtx, current)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }
    if (current.status === 'approved') {
      return NextResponse.json(
        { success: false, error: 'This form has been approved and can no longer be edited.' },
        { status: 403 }
      )
    }

    // Validate input
    const parsed = LandImprovementUpdateSchema.safeParse(body)
    if (!parsed.success) {
      console.error('Zod validation failed:', JSON.stringify(parsed.error.issues, null, 2))
      console.error('Body keys sent:', Object.keys(body))
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      )
    }

    // Remove the id from the body to avoid conflicts
    const updateData = parsed.data
    
    // Clean the data: remove undefined and empty string values; allow explicit null to clear fields
    const numericFields = ['area', 'market_value', 'land_market_value', 'improvement_market_value', 'improvement_assessment_level', 'assessment_level', 'assessed_value', 'land_area', 'unit_value', 'base_market_value', 'additional_percentage_value', 'additional_flat_rate_value', 'previous_av', 'previous_mv', 'previous_area']
    const cleanedData = sanitizeFaasUpdatePayload(updateData, {
      numericFields,
    })
    
    const { data, error } = await supabase
      .from('land_improvements')
      .update(cleanedData)
      .eq('id', recordId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating land improvement:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update land improvement', details: error.message },
        { status: 500 }
      )
    }
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Land improvement not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Delete land improvement record
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userCtx = await getCurrentUserContext()
    if (!userCtx) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { id } = await params

    const isAdmin = userCtx.isAdmin
    if (!isAdmin) {
      // Non-admins can only delete their own draft or returned records
      const { data: record, error: fetchErr } = await supabase
        .from('land_improvements')
        .select('status, created_by')
        .eq('id', id)
        .single()

      if (fetchErr || !record) {
        return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 })
      }
      if (!['draft', 'returned'].includes(record.status) || record.created_by !== userCtx.userId) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }
    }

    const { error } = await supabase
      .from('land_improvements')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting land improvement:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete land improvement', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, message: 'Land improvement deleted successfully' })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
