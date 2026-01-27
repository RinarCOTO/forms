import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    
    const buildingStructure = await prisma.buildingStructure.findUnique({
      where: { id },
    });
    
    if (!buildingStructure) {
      return NextResponse.json(
        { success: false, error: 'Building structure not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: buildingStructure,
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
    
    // Build update data object (only include fields that are provided)
    const updateData: any = {};
    
    if (body.arp_no !== undefined) updateData.arpNo = body.arp_no;
    if (body.pin !== undefined) updateData.pin = body.pin;
    if (body.owner_name !== undefined) updateData.ownerName = body.owner_name;
    if (body.owner_address !== undefined) updateData.ownerAddress = body.owner_address;
    if (body.type_of_building !== undefined) updateData.typeOfBuilding = body.type_of_building;
    if (body.number_of_storeys !== undefined) updateData.numberOfStoreys = body.number_of_storeys;
    if (body.date_constructed !== undefined) updateData.dateConstructed = body.date_constructed ? new Date(body.date_constructed) : null;
    if (body.date_completed !== undefined) updateData.dateCompleted = body.date_completed ? new Date(body.date_completed) : null;
    if (body.date_occupied !== undefined) updateData.dateOccupied = body.date_occupied ? new Date(body.date_occupied) : null;
    if (body.total_floor_area !== undefined) updateData.totalFloorArea = body.total_floor_area;
    if (body.construction_type !== undefined) updateData.constructionType = body.construction_type;
    if (body.structure_type !== undefined) updateData.structureType = body.structure_type;
    if (body.electrical_system !== undefined) updateData.electricalSystem = body.electrical_system;
    if (body.plumbing_system !== undefined) updateData.plumbingSystem = body.plumbing_system;
    if (body.roofing_material !== undefined) updateData.roofingMaterial = body.roofing_material;
    if (body.actual_use !== undefined) updateData.actualUse = body.actual_use;
    if (body.market_value !== undefined) updateData.marketValue = body.market_value;
    if (body.assessment_level !== undefined) updateData.assessmentLevel = body.assessment_level;
    if (body.estimated_value !== undefined) updateData.estimatedValue = body.estimated_value;
    if (body.amount_in_words !== undefined) updateData.amountInWords = body.amount_in_words;
    if (body.status !== undefined) updateData.status = body.status;
    
    const buildingStructure = await prisma.buildingStructure.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Building structure updated successfully',
      data: buildingStructure,
    });
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { success: false, error: 'Building structure not found' },
        { status: 404 }
      );
    }
    
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
    
    await prisma.buildingStructure.delete({
      where: { id },
    });
    
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
