import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface BuildingStructureInput {
  arp_no?: string;
  pin?: string;
  owner_name?: string;
  owner_address?: string;
  admin_care_of?: string;
  admin_address?: string;
  property_address?: string;
  type_of_building?: string;
  number_of_storeys?: number;
  date_constructed?: string;
  date_completed?: string;
  date_occupied?: string;
  building_permit_no?: string;
  total_floor_area?: number;
  floor_areas?: number[] | string[];
  construction_type?: string;
  structure_type?: string;
  foundation_type?: string;
  electrical_system?: string;
  plumbing_system?: string;
  roofing_material?: string;
  wall_material?: string;
  flooring_material?: string;
  ceiling_material?: string;
  actual_use?: string;
  market_value?: number;
  assessment_level?: number;
  estimated_value?: number;
  amount_in_words?: string;
  status?: string;
  land_owner?: string;
  td_arp_no?: string;
  land_area?: number;
}

/**
 * POST - Create a new building structure record
 */
export async function POST(request: NextRequest) {
  try {
    const body: BuildingStructureInput = await request.json();
    
    console.log('🔵 API received data:', body);
    
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Map the input data to match the database schema
    const dbData: any = {
      arp_no: body.arp_no || null,
      pin: body.pin || null,
      owner_name: body.owner_name || null,
      owner_address: body.owner_address || null,
      admin_care_of: body.admin_care_of || null,
      admin_address: body.admin_address || null,
      property_address: body.property_address || null,
      type_of_building: body.type_of_building || null,
      number_of_storeys: body.number_of_storeys ? parseInt(body.number_of_storeys.toString()) : null,
      date_constructed: body.date_constructed ? (body.date_constructed.length === 4 ? `${body.date_constructed}-01-01` : body.date_constructed) : null,
      completion_issued_on: body.completion_issued_on ? (body.completion_issued_on.length === 4 ? `${body.completion_issued_on}-01-01` : body.completion_issued_on) : null,
      date_completed: body.date_completed ? (body.date_completed.length === 4 ? `${body.date_completed}-01-01` : body.date_completed) : null,
      date_occupied: body.date_occupied ? (body.date_occupied.length === 4 ? `${body.date_occupied}-01-01` : body.date_occupied) : null,
      building_permit_no: body.building_permit_no || null,
      total_floor_area: body.total_floor_area ? parseFloat(body.total_floor_area.toString()) : null,
      floor_areas: body.floor_areas ? JSON.stringify(body.floor_areas) : null,
      construction_type: body.construction_type || null,
      structure_type: body.structure_type || null,
      foundation_type: body.foundation_type || null,
      electrical_system: body.electrical_system || null,
      plumbing_system: body.plumbing_system || null,
      roofing_material: body.roofing_material || null,
      wall_material: body.wall_material || null,
      flooring_material: body.flooring_material || null,
      ceiling_material: body.ceiling_material || null,
      actual_use: body.actual_use || null,
      market_value: body.market_value ? parseFloat(body.market_value.toString()) : null,
      assessment_level: body.assessment_level ? parseFloat(body.assessment_level.toString()) : null,
      estimated_value: body.estimated_value ? parseFloat(body.estimated_value.toString()) : null,
      amount_in_words: body.amount_in_words || null,
      status: body.status || 'draft',
      updated_at: new Date().toISOString(),
      land_owner: body.land_owner || null,
      td_arp_no: body.td_arp_no || null,
      land_area: body.land_area ? parseFloat(body.land_area.toString()) : null,
      

    };
    
    const { data, error } = await supabase
      .from('building_structures')
      .insert([dbData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating building structure:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create building structure',
          message: error.message,
          details: error
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Building structure created successfully',
      data: data,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating building structure:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create building structure',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve all building structure records
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Build query
    let query = supabase
      .from('building_structures')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.or(`owner_name.ilike.%${search}%,arp_no.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching building structures:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch building structures',
          message: error.message,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
      },
    });
    
  } catch (error) {
    console.error('Error fetching building structures:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch building structures',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
