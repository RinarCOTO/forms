import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { data, error } = await supabase
      .from('building_structures')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching building structure:', error);
      return NextResponse.json(
        { success: false, error: 'Building structure not found', details: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data,
    });
    
  } catch (error) {
    console.error('Error fetching building structure:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch building structure',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
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
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const body: any = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Only include fields that are actually provided in the request
    // This allows partial updates without overwriting existing data
    const dbData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Only add fields that are present in the body
    if (body.arp_no !== undefined) dbData.arp_no = body.arp_no || null;
    if (body.pin !== undefined) dbData.pin = body.pin || null;
    if (body.owner_name !== undefined) dbData.owner_name = body.owner_name || null;
    if (body.owner_address !== undefined) dbData.owner_address = body.owner_address || null;
    if (body.admin_care_of !== undefined) dbData.admin_care_of = body.admin_care_of || null;
    if (body.admin_address !== undefined) dbData.admin_address = body.admin_address || null;
    if (body.property_address !== undefined) dbData.property_address = body.property_address || null;
    if (body.type_of_building !== undefined) dbData.type_of_building = body.type_of_building || null;
    if (body.number_of_storeys !== undefined) dbData.number_of_storeys = body.number_of_storeys ? parseInt(body.number_of_storeys.toString()) : null;
    if (body.date_constructed !== undefined) dbData.date_constructed = body.date_constructed ? (body.date_constructed.length === 4 ? `${body.date_constructed}-01-01` : body.date_constructed) : null;
    if (body.date_completed !== undefined) dbData.date_completed = body.date_completed ? (body.date_completed.length === 4 ? `${body.date_completed}-01-01` : body.date_completed) : null;
    if (body.date_occupied !== undefined) dbData.date_occupied = body.date_occupied ? (body.date_occupied.length === 4 ? `${body.date_occupied}-01-01` : body.date_occupied) : null;
    if (body.building_permit_no !== undefined) dbData.building_permit_no = body.building_permit_no || null;
    if (body.total_floor_area !== undefined) dbData.total_floor_area = body.total_floor_area ? parseFloat(body.total_floor_area.toString()) : null;
    if (body.construction_type !== undefined) dbData.construction_type = body.construction_type || null;
    if (body.structure_type !== undefined) dbData.structure_type = body.structure_type || null;
    if (body.foundation_type !== undefined) dbData.foundation_type = body.foundation_type || null;
    if (body.electrical_system !== undefined) dbData.electrical_system = body.electrical_system || null;
    if (body.plumbing_system !== undefined) dbData.plumbing_system = body.plumbing_system || null;
    if (body.roofing_material !== undefined) dbData.roofing_material = body.roofing_material || null;
    if (body.wall_material !== undefined) dbData.wall_material = body.wall_material || null;
    if (body.flooring_material !== undefined) dbData.flooring_material = body.flooring_material || null;
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
      {
        success: false,
        error: 'Failed to update building structure',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
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
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { error } = await supabase
      .from('building_structures')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting building structure:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete building structure', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Building structure deleted successfully',
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { success: false, error: 'Building structure not found' },
        { status: 404 }
      );
    }
    
    console.error('Error deleting building structure:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete building structure',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
