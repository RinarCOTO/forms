import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- HELPER FUNCTIONS ---

// Helper: Sanitize floor areas (removes empty strings/NaNs that crash the DB)
const cleanFloorAreas = (areas: any[] | undefined): number[] | null => {
  if (!Array.isArray(areas) || areas.length === 0) return null;
  // Convert to numbers and remove NaNs/empty strings
  const cleaned = areas
    .map(a => (a === "" || a === null || a === undefined) ? NaN : Number(a))
    .filter(n => !isNaN(n));
  return cleaned.length > 0 ? cleaned : null;
};

// --- API HANDLERS ---

/**
 * GET - Retrieve a single building structure by ID
 */
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

/**
 * PUT - Update a building structure by ID
 */
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

    // --- 1. HANDLE FLOOR AREAS ARRAY ---
    if (body.floor_areas !== undefined) {
      dbData.floor_areas = cleanFloorAreas(body.floor_areas);
    }

    // --- 2. HANDLE JSON MATERIAL DATA (Updated for New Schema) ---
    // This section maps the Frontend objects (containing summary + grid) directly to the DB columns.
    // The columns 'roofing_material', 'flooring_material', and 'wall_material' must be type JSONB in Supabase.
    
    // Clean roof material data - filter out numeric keys that may cause issues
    if (body.roofing_material !== undefined) {
      if (typeof body.roofing_material === 'object' && body.roofing_material !== null && body.roofing_material.data) {
        const cleanedData = Object.keys(body.roofing_material.data).reduce((acc, key) => {
          // Only include non-numeric keys (the actual material properties)
          if (!(/^\d+$/.test(key))) {
            acc[key] = body.roofing_material.data[key];
          }
          return acc;
        }, {} as any);
        
        dbData.roofing_material = {
          ...body.roofing_material,
          data: cleanedData
        };
      } else {
        dbData.roofing_material = body.roofing_material;
      }
    }
    if (body.flooring_material !== undefined) dbData.flooring_material = body.flooring_material;
    if (body.wall_material !== undefined) dbData.wall_material = body.wall_material;

    // --- 3. HANDLE ALL OTHER FIELDS ---
    if (body.arp_no !== undefined) dbData.arp_no = body.arp_no || null;
    if (body.pin !== undefined) dbData.pin = body.pin || null;
    if (body.owner_name !== undefined) dbData.owner_name = body.owner_name || null;
    if (body.owner_address !== undefined) dbData.owner_address = body.owner_address || null;
    if (body.admin_care_of !== undefined) dbData.admin_care_of = body.admin_care_of || null;
    if (body.admin_address !== undefined) dbData.admin_address = body.admin_address || null;
    if (body.property_address !== undefined) dbData.property_address = body.property_address || null;
    if (body.type_of_building !== undefined) dbData.type_of_building = body.type_of_building || null;
    if (body.number_of_storeys !== undefined) dbData.number_of_storeys = body.number_of_storeys ? parseInt(body.number_of_storeys.toString()) : null;
    
    // Date conversions
    const formatDate = (val: string) => val && val.length === 4 ? `${val}-01-01` : val;
    if (body.date_constructed !== undefined) dbData.date_constructed = formatDate(body.date_constructed) || null;
    if (body.completion_issued_on !== undefined) dbData.completion_issued_on = formatDate(body.completion_issued_on) || null;
    if (body.date_completed !== undefined) dbData.date_completed = formatDate(body.date_completed) || null;
    if (body.date_occupied !== undefined) dbData.date_occupied = formatDate(body.date_occupied) || null;
    
    if (body.building_permit_no !== undefined) dbData.building_permit_no = body.building_permit_no || null;
    if (body.total_floor_area !== undefined) dbData.total_floor_area = body.total_floor_area ? parseFloat(body.total_floor_area.toString()) : null;
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

    const { data, error } = await supabase
      .from('building_structures')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating building structure:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update building structure', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Building structure updated successfully',
      data: data,
    });

  } catch (error) {
    console.error('Error updating building structure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update building structure' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a building structure by ID
 */
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