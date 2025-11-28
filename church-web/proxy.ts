import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/admin']
// Routes that require admin role
const adminRoutes = ['/admin']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip for static files and API routes
  if (pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname === '/favicon.ico' ||
      pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2)$/)) {
    return NextResponse.next()
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // Get JWT token from cookies (works in Edge Runtime)
  const token = await getToken({ 
    req: request, 
    secret: process.env.AUTH_SECRET 
  })

  // Handle protected routes
  if (isProtectedRoute) {
    if (!token) {
      // Redirect unauthenticated users to sign in
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Check admin role for admin routes
    if (isAdminRoute) {
      const userRole = token.role as string | undefined
      const allowedRoles = ['ADMIN', 'PASTOR', 'STAFF']
      
      if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirect non-admin users to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if (token && (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check maintenance mode for public routes (skip for authenticated admin users)
  const isAdminUser = token && ['ADMIN', 'PASTOR', 'STAFF'].includes(token.role as string)
  
  if (!isProtectedRoute && !pathname.startsWith('/auth') && !isAdminUser) {
    try {
      const apiUrl = new URL('/api/maintenance-check', request.url)
      
      // In development, use HTTP to avoid SSL issues
      if (process.env.NODE_ENV === 'development') {
        apiUrl.protocol = 'http:'
      }
      
      const maintenanceResponse = await fetch(apiUrl.toString(), {
        headers: {
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
      console.error('Proxy maintenance check error:', error)
      // If maintenance check fails, allow the request to continue
    }
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
