import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Map service names to their base URLs (from env vars, fallback to localhost)
const SERVICE_URLS: Record<string, string> = {
  locations: process.env.LOCATIONS_SERVICE_URL ?? 'http://localhost:3001',
  notes:     process.env.NOTES_SERVICE_URL     ?? 'http://localhost:3002',
  users:     process.env.USERS_SERVICE_URL     ?? 'http://localhost:3003',
  faas:      process.env.FAAS_SERVICE_URL      ?? 'http://localhost:3004',
  review:    process.env.REVIEW_SERVICE_URL    ?? 'http://localhost:3005',
  print:     process.env.PRINT_SERVICE_URL     ?? 'http://localhost:3006',
}

async function proxy(req: NextRequest, service: string, path: string[]) {
  const serviceBase = SERVICE_URLS[service]
  if (!serviceBase) {
    return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 404 })
  }

  // Get the user's JWT from the Supabase cookie session
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const targetPath = '/' + path.join('/')
  const targetUrl = new URL(targetPath + (req.nextUrl.search || ''), serviceBase)

  const headers: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') ?? 'application/json',
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  // Print service needs the raw cookies so Puppeteer can authenticate against the main app
  if (service === 'print') {
    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) headers['x-forwarded-cookies'] = cookieHeader
  }

  const isFormData = req.headers.get('content-type')?.includes('multipart/form-data')

  const init: RequestInit = {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD'
      ? isFormData ? await req.formData() : await req.text()
      : undefined,
  }

  if (isFormData) {
    // Let fetch set the correct multipart boundary
    delete headers['Content-Type']
  }

  try {
    const response = await fetch(targetUrl.toString(), init)
    const data = await response.text()

    return new NextResponse(data, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/json' },
    })
  } catch (err) {
    return NextResponse.json({ error: `Service unavailable: ${service}` }, { status: 503 })
  }
}

type RouteContext = {
  params: Promise<{ service: string; path: string[] }>
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { service, path } = await ctx.params
  return proxy(req, service, path)
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { service, path } = await ctx.params
  return proxy(req, service, path)
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const { service, path } = await ctx.params
  return proxy(req, service, path)
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const { service, path } = await ctx.params
  return proxy(req, service, path)
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { service, path } = await ctx.params
  return proxy(req, service, path)
}
