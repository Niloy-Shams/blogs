// Fix middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Define paths that should be protected
  const isProtectedPath = path.startsWith('/blog/create')
  
  // The issue is here - check localStorage and cookies properly
  // In Next.js middleware, we can only check cookies, not localStorage
  const accessToken = request.cookies.get('accessToken')?.value
  
  if (isProtectedPath && !accessToken) {
    // Redirect to login if attempting to access protected route while not authenticated
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

// Configure middleware to run only on specific paths
export const config = {
  matcher: ['/blog/create'],
}