import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface BuildingStructureInput {
  arp_no?: string;
  pin?: string;
  owner_name?: string;
  owner_address?: string;
  type_of_building?: string;
  number_of_storeys?: number;
  date_constructed?: string;
  date_completed?: string;
  date_occupied?: string;
  building_permit_no?: string;
  total_floor_area?: number;
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
}

/**
 * POST - Create a new building structure record
 */
export async function POST(request: NextRequest) {
  try {
    const body: BuildingStructureInput = await request.json();
    
    // Check if Prisma client is available
    if (!prisma) {
      throw new Error('Database connection not available');
    }
    
    const buildingStructure = await prisma.buildingStructure.create({
      data: {
        arpNo: body.arp_no || null,
        pin: body.pin || null,
        ownerName: body.owner_name || null,
        ownerAddress: body.owner_address || null,
        typeOfBuilding: body.type_of_building || null,
        numberOfStoreys: body.number_of_storeys || null,
        dateConstructed: body.date_constructed ? new Date(body.date_constructed) : null,
        dateCompleted: body.date_completed ? new Date(body.date_completed) : null,
        dateOccupied: body.date_occupied ? new Date(body.date_occupied) : null,
        buildingPermitNo: body.building_permit_no || null,
        totalFloorArea: body.total_floor_area || null,
        constructionType: body.construction_type || null,
        structureType: body.structure_type || null,
        foundationType: body.foundation_type || null,
        electricalSystem: body.electrical_system || null,
        plumbingSystem: body.plumbing_system || null,
        roofingMaterial: body.roofing_material || null,
        wallMaterial: body.wall_material || null,
        flooringMaterial: body.flooring_material || null,
        ceilingMaterial: body.ceiling_material || null,
        actualUse: body.actual_use || null,
        marketValue: body.market_value || null,
        assessmentLevel: body.assessment_level || null,
        estimatedValue: body.estimated_value || null,
        amountInWords: body.amount_in_words || null,
        status: body.status || 'draft',
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Building structure created successfully',
      data: buildingStructure,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating building structure:', error);
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to create building structure';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Database connection')) {
        errorMessage = 'Database is not connected. Please check your DATABASE_URL environment variable.';
        statusCode = 503; // Service Unavailable
      } else if (error.message.includes("Can't reach database")) {
        errorMessage = 'Cannot reach database server. Please ensure PostgreSQL is running.';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check DATABASE_URL in .env file and ensure database is running'
      },
      { status: statusCode }
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
    
    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { ownerName: { contains: search, mode: 'insensitive' } },
        { arpNo: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Fetch records with pagination
    const [buildingStructures, total] = await Promise.all([
      prisma.buildingStructure.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.buildingStructure.count({ where }),
    ]);
    
    return NextResponse.json({
      success: true,
      data: buildingStructures,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
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
