import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- HELPER FUNCTIONS ---

const cleanFloorAreas = (areas: any[] | undefined): number[] | null => {
  if (!Array.isArray(areas) || areas.length === 0) return null;
  const cleaned = areas
    .map(a => (a === "" || a === null || a === undefined) ? NaN : Number(a))
    .filter(n => !isNaN(n));
  return cleaned.length > 0 ? cleaned : null;
};

// --- API HANDLERS ---

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const { data, error } = await supabase
      .from('building_structures')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Building structure not found', details: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: data });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch building structure' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    const body: any = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const dbData: any = {
      updated_at: new Date().toISOString()
    };

    const toNumber = (val: any) => {
      if (val === null || val === undefined || val === '') return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    if (body.base_unit_cost !== undefined) {
      dbData.base_unit_cost = toNumber(body.base_unit_cost);
    }

    if (body.selected_deductions !== undefined) {
      dbData.selected_deductions = Array.isArray(body.selected_deductions)
        ? body.selected_deductions.map(String)
        : null;
    }

    if (body.total_deduction_percentage !== undefined) {
      dbData.total_deduction_percentage = toNumber(body.total_deduction_percentage);
    }

    if (body.total_deduction_amount !== undefined) {
      dbData.total_deduction_amount = toNumber(body.total_deduction_amount);
    }

    if (body.net_unit_construction_cost !== undefined) {
      dbData.net_unit_construction_cost = toNumber(body.net_unit_construction_cost);
    }

    if (body.overall_comments !== undefined) {
      dbData.overall_comments = body.overall_comments || null;
    }

    if (body.additional_percentage_choice !== undefined) {
      dbData.additional_percentage_choice = body.additional_percentage_choice || null;
    }
    if (body.additional_percentage_value !== undefined) {
      dbData.additional_percentage_value = toNumber(body.additional_percentage_value);
    }
    if (body.additional_percentage_areas !== undefined) {
      dbData.additional_percentage_areas = cleanFloorAreas(body.additional_percentage_areas);
    }

    if (body.additional_flat_rate_choice !== undefined) {
      dbData.additional_flat_rate_choice = body.additional_flat_rate_choice || null;
    }
    if (body.additional_flat_rate_value !== undefined) {
      dbData.additional_flat_rate_value = toNumber(body.additional_flat_rate_value);
    }
    if (body.additional_flat_rate_areas !== undefined) {
      dbData.additional_flat_rate_areas = cleanFloorAreas(body.additional_flat_rate_areas);
    }

    if (body.total_addition_amount !== undefined) {
      dbData.total_addition_amount = toNumber(body.total_addition_amount);
    }

    if (body.floor_areas !== undefined) {
      dbData.floor_areas = cleanFloorAreas(body.floor_areas);
    }

    if (body.roofing_material !== undefined) {
      if (typeof body.roofing_material === 'object' && body.roofing_material !== null && body.roofing_material.data) {
        const cleanedData = Object.keys(body.roofing_material.data).reduce((acc, key) => {
          if (!(/^\d+$/.test(key))) {
            acc[key] = body.roofing_material.data[key];
          }
          return acc;
        }, {} as any);
        dbData.roofing_material = { ...body.roofing_material, data: cleanedData };
      } else {
        dbData.roofing_material = body.roofing_material;
      }
    }

    if (body.flooring_material !== undefined) dbData.flooring_material = body.flooring_material;
    if (body.wall_material !== undefined) dbData.wall_material = body.wall_material;

    if (body.arp_no !== undefined) dbData.arp_no = body.arp_no || null;
    if (body.pin !== undefined) dbData.pin = body.pin || null;
    if (body.owner_name !== undefined) dbData.owner_name = body.owner_name || null;
    if (body.owner_address !== undefined) dbData.owner_address = body.owner_address || null;
    if (body.admin_care_of !== undefined) dbData.admin_care_of = body.admin_care_of || null;
    if (body.admin_address !== undefined) dbData.admin_address = body.admin_address || null;
    if (body.property_address !== undefined) dbData.property_address = body.property_address || null;
    if (body.type_of_building !== undefined) dbData.type_of_building = body.type_of_building || null;
    if (body.number_of_storeys !== undefined) {
      const parsed = parseInt(body.number_of_storeys.toString(), 10);
      dbData.number_of_storeys = isNaN(parsed) ? null : parsed;
    }

    const formatDate = (val: string) => val && val.length === 4 ? `${val}-01-01` : val;
    if (body.date_constructed !== undefined) dbData.date_constructed = formatDate(body.date_constructed) || null;
    if (body.completion_issued_on !== undefined) dbData.completion_issued_on = formatDate(body.completion_issued_on) || null;
    if (body.date_completed !== undefined) dbData.date_completed = formatDate(body.date_completed) || null;
    if (body.date_occupied !== undefined) dbData.date_occupied = formatDate(body.date_occupied) || null;

    if (body.building_permit_no !== undefined) dbData.building_permit_no = body.building_permit_no || null;
    if (body.total_floor_area !== undefined) dbData.total_floor_area = body.total_floor_area ? parseFloat(body.total_floor_area.toString()) : null;
    if (body.cost_of_construction !== undefined) dbData.cost_of_construction = body.cost_of_construction ? parseFloat(body.cost_of_construction.toString()) : null;
    if (body.land_owner !== undefined) dbData.land_owner = body.land_owner || null;
    if (body.td_arp_no !== undefined) dbData.td_arp_no = body.td_arp_no || null;
    if (body.land_area !== undefined) dbData.land_area = body.land_area ? parseFloat(body.land_area.toString()) : null;

    if (body.construction_type !== undefined) dbData.construction_type = body.construction_type || null;
    if (body.structure_type !== undefined) dbData.structure_type = body.structure_type || null;
    if (body.foundation_type !== undefined) dbData.foundation_type = body.foundation_type || null;
    if (body.electrical_system !== undefined) dbData.electrical_system = body.electrical_system || null;
    if (body.plumbing_system !== undefined) dbData.plumbing_system = body.plumbing_system || null;

    if (body.ceiling_material !== undefined) dbData.ceiling_material = body.ceiling_material || null;
    if (body.actual_use !== undefined) dbData.actual_use = body.actual_use || null;
    if (body.market_value !== undefined) dbData.market_value = body.market_value ? parseFloat(body.market_value.toString()) : null;
    if (body.assessment_level !== undefined) dbData.assessment_level = body.assessment_level ? parseFloat(body.assessment_level.toString()) : null;
    if (body.estimated_value !== undefined) dbData.estimated_value = body.estimated_value ? parseFloat(body.estimated_value.toString()) : null;
    if (body.amount_in_words !== undefined) dbData.amount_in_words = body.amount_in_words || null;
    if (body.status !== undefined) dbData.status = body.status || 'draft';

    // --- DEBUG LOGS ---
    console.log('🔵 Attempting update for ID:', id);
    console.log('🔵 dbData:', JSON.stringify(dbData, null, 2));

    const { data, error } = await supabase
      .from('building_structures')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('🔴 Supabase error code:', error.code);
      console.error('🔴 Supabase error message:', error.message);
      console.error('🔴 Supabase error details:', error.details);
      console.error('🔴 Supabase error hint:', error.hint);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update building structure',
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Building structure updated successfully',
      data: data,
    });

  } catch (error) {
    console.error('🔴 Catch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update building structure' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString);
    
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    const { error } = await supabase
      .from('building_structures')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete building structure' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Building structure deleted successfully',
    });
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete building structure' },
      { status: 500 }
    );
  }
}