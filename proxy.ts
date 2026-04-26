import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminJwt, verifyLegacyHmac } from '@/lib/auth'

// Admin-only API routes — require valid admin_auth cookie
const ADMIN_API_PREFIXES = [
  '/api/clients',
  '/api/leads',
  '/api/campaigns',
  '/api/generate',
  '/api/send-preview',
  '/api/settings',
  '/api/users',
]

// Routes only superadmin can access
const SUPERADMIN_ONLY_PAGES = ['/admin/users', '/admin/settings', '/admin/setup']

async function verifyToken(token: string): Promise<{ valid: boolean; role?: string } > {
  // Try JWT first (new multi-user system)
  const jwt = await verifyAdminJwt(token)
  if (jwt) return { valid: true, role: jwt.role }

  // Fall back to legacy HMAC (single-password, treated as superadmin)
  const legacy = await verifyLegacyHmac(token)
  if (legacy) return { valid: true, role: 'superadmin' }

  return { valid: false }
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const { pathname } = request.nextUrl
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'yaweb.ai'

  // Skip Next.js internals and static files
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // In production: detect subdomains
  if (host.endsWith(`.${appDomain}`)) {
    const subdomain = host.replace(`.${appDomain}`, '')
    if (subdomain === 'demo')  return NextResponse.next()
    if (subdomain === 'admin') return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url))
    if (subdomain && subdomain !== 'www') {
      return NextResponse.rewrite(new URL(`/site/${subdomain}${pathname}`, request.url))
    }
  }

  // Bootstrap endpoint — has its own auth via admin_password, must be public
  if (pathname === '/api/users/seed') return NextResponse.next()

  const isAdminPage = pathname.startsWith('/admin')
  const isAdminApi  = ADMIN_API_PREFIXES.some(p => pathname.startsWith(p))

  if (isAdminPage || isAdminApi) {
    const token = request.cookies.get('admin_auth')?.value ?? ''
    const { valid, role } = await verifyToken(token)

    if (!valid) {
      if (isAdminPage && pathname !== '/admin/login') {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Role check: superadmin-only pages redirect comerciales to /admin
    if (valid && role === 'comercial' && isAdminPage) {
      const restricted = SUPERADMIN_ONLY_PAGES.some(p => pathname.startsWith(p))
      if (restricted) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
