import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserContext } from '@/lib/services/user.service';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getBrowser } from '@/lib/puppeteer-browser';

export const maxDuration = 60;

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

    // 2. Verify the record exists
    const admin = getAdminClient();
    const { data: record, error } = await admin
      .from('machinery')
      .select('id, location_municipality')
      .eq('id', id)
      .single();

    if (error || !record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    if (!userCtx.isAdmin && userCtx.municipality &&
        record.location_municipality?.toLowerCase() !== userCtx.municipality.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Pass cookies for auth
    const cookieHeader = request.headers.get('cookie') || '';

    // 4. Build print URL
    const { origin } = new URL(request.url);
    const printUrl = `${origin}/machinery/print-only?id=${id}`;

    // 5. Get shared browser instance
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {

      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map((c) => {
          const [name, ...rest] = c.trim().split('=');
          return { name: name.trim(), value: rest.join('='), domain: new URL(request.url).hostname };
        });
        await page.setCookie(...cookies);
      }

      await page.goto(printUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForSelector('[data-print-ready="true"]', { timeout: 15000 });
      await new Promise((r) => setTimeout(r, 500));

      await page.addStyleTag({
        content: `@media print { .min-h-screen { background: white !important; min-height: 0 !important; } }`,
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '6mm', bottom: '8mm', left: '8mm', right: '8mm' },
      });

      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="RPFAAS-Machinery-${id}.pdf"`,
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
