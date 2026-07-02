import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserContext } from '@/lib/services/user.service';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getBrowser } from '@/lib/puppeteer-browser';

export const maxDuration = 60; // seconds — requires Vercel Pro; on Hobby falls back to 10s

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const { id } = params;

    // 1. Authenticate
    const userCtx = await getCurrentUserContext();
    if (!userCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify the record exists and belongs to this user's municipality
    const admin = getAdminClient();
    const { data: record, error } = await admin
      .from('building_structures')
      .select('id, municipality, owner_name, arp_no')
      .eq('id', id)
      .single();

    if (error || !record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    if (!userCtx.isAdmin && userCtx.municipality &&
        record.municipality?.toLowerCase() !== userCtx.municipality.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Get all request cookies to pass to Puppeteer for auth
    const cookieHeader = request.headers.get('cookie') || '';

    // 4. Derive the base URL from the incoming request
    const requestUrl = new URL(request.url);
    const includeAttachments = requestUrl.searchParams.get('attachments') !== '0';
    const printUrl = `${requestUrl.origin}/building-other-structure/print-only?id=${id}${includeAttachments ? '' : '&attachments=0'}`;

    // 5. Get shared browser instance
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {

      // Pass auth cookies so the print page can fetch from the DB
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map((c) => {
          const [name, ...rest] = c.trim().split('=');
          return { name: name.trim(), value: rest.join('='), domain: new URL(request.url).hostname };
        });
        await page.setCookie(...cookies);
      }

      await page.goto(printUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait until the form + all photo images have finished rendering
      await page.waitForSelector('[data-all-ready="true"]', { timeout: 25000 });
      await new Promise((r) => setTimeout(r, 300));

      await page.addStyleTag({
        content: `@media print { .min-h-screen { background: white !important; min-height: 0 !important; } }`,
      });


      const pdf = await page.pdf({
        format: 'A4',
        landscape: false,
        preferCSSPageSize: true,
        printBackground: true,
        margin: { top: '6mm', bottom: '8mm', left: '8mm', right: '8mm' },
      });

      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="RPFAAS-Building_${record.owner_name ?? 'Unknown'}_${record.arp_no ?? 'Unknown'}_${new Date().toISOString().slice(0, 10)}.pdf"`,
        },
      });
    } finally {
      await page.close();
    }
  } catch (err: any) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: 'PDF generation failed', detail: err.message }, { status: 500 });
  }
}
