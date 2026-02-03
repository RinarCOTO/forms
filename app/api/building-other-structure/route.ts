import { NextRequest, NextResponse } from 'next/server';

// In-memory store for demonstration (replace with DB in production)
let drafts: any[] = [];
let idCounter = 1;

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const newDraft = { ...data, id: idCounter++ };
    drafts.push(newDraft);
    return NextResponse.json({ success: true, data: newDraft });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid request', error: String(error) }, { status: 400 });
  }
}
