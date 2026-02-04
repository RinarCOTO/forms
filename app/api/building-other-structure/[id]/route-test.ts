import { NextRequest, NextResponse } from 'next/server';

// Simple test route to verify the dynamic route is working
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  console.log('TEST - GET /api/building-other-structure/[id] - Starting');
  
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
    console.log('TEST - ID received:', id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'API route is working',
      id: id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('TEST - Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  console.log('TEST - PUT /api/building-other-structure/[id] - Starting');
  
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const data = await req.json();
    
    console.log('TEST - PUT ID:', id);
    console.log('TEST - PUT Data:', data);
    
    return NextResponse.json({ 
      success: true, 
      message: 'PUT route is working',
      id: id,
      receivedData: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('TEST - PUT Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}