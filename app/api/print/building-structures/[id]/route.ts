import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserContext } from '@/lib/services/user.service';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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
    const { origin } = new URL(request.url);
    const printUrl = `${origin}/building-other-structure/print-only?id=${id}`;

    // 5. Launch Puppeteer
    let chromium: any;
    let puppeteer: any;

    if (process.env.NODE_ENV === 'production') {
      chromium = (await import('@sparticuz/chromium-min')).default;
      puppeteer = (await import('puppeteer-core')).default;
      chromium.setHeadlessMode = true;
      chromium.setGraphicsMode = false;
    } else {
      puppeteer = (await import('puppeteer-core')).default;
      chromium = null;
    }

    const browser = await (chromium
      ? puppeteer.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(
            `https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar`
          ),
          headless: chromium.headless,
        })
      : puppeteer.launch({
          channel: 'chrome',
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }));

    try {
      const page = await browser.newPage();

      // Pass auth cookies so the print page can fetch from the DB
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map((c) => {
          const [name, ...rest] = c.trim().split('=');
          return { name: name.trim(), value: rest.join('='), domain: new URL(request.url).hostname };
        });
        await page.setCookie(...cookies);
      }

      await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait until the form signals it has finished rendering DB data
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
          'Content-Disposition': `inline; filename="RPFAAS-Building_${record.owner_name ?? 'Unknown'}_${record.arp_no ?? 'Unknown'}_${new Date().toISOString().slice(0, 10)}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err: any) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ error: 'PDF generation failed', detail: err.message }, { status: 500 });
  }
}
