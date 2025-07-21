import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for admin routes, API routes, and static files
  if (pathname.startsWith('/admin') || 
      pathname.startsWith('/api') ||
      pathname.startsWith('/_next') ||
      pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // Check if maintenance mode is enabled via API
  try {
    const maintenanceResponse = await fetch(new URL('/api/maintenance-check', request.url), {
      headers: {
        // Forward cookies to maintain session for admin check
        cookie: request.headers.get('cookie') || ''
      }
    })
    
    if (maintenanceResponse.ok) {
      const { maintenanceMode } = await maintenanceResponse.json()
      
      // If maintenance mode is ON and user is not on maintenance page
      if (maintenanceMode && pathname !== '/maintenance') {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
      
      // If maintenance mode is OFF and user is on maintenance page
      if (!maintenanceMode && pathname === '/maintenance') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  } catch (error) {
    console.error('Middleware error:', error)
    // If maintenance check fails, allow the request to continue
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
