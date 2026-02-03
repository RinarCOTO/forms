import { NextRequest, NextResponse } from 'next/server';

// In-memory store for demonstration (replace with DB in production)
let drafts: any[] = [];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const draft = drafts.find(d => d.id === Number(params.id));
  if (draft) {
    return NextResponse.json({ success: true, data: draft });
  } else {
    return NextResponse.json({ success: false, message: 'Draft not found' }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const idx = drafts.findIndex(d => d.id === Number(params.id));
    if (idx !== -1) {
      drafts[idx] = { ...drafts[idx], ...data };
      return NextResponse.json({ success: true, data: drafts[idx] });
    } else {
      return NextResponse.json({ success: false, message: 'Draft not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid request', error: String(error) }, { status: 400 });
  }
}
