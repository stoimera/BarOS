import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { CORRELATION_ID_HEADER, resolveCorrelationIdFromRequest } from '@/lib/observability/correlation-id';

// Middleware function for authentication and route protection
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const correlationId = resolveCorrelationIdFromRequest(req);
  res.headers.set(CORRELATION_ID_HEADER, correlationId);
  
  // Initialize Supabase client for server-side authentication
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Fetch authenticated user directly (avoids trusting cookie/session payload blindly)
  const { data: { user } } = await supabase.auth.getUser();
  const session = user ? { user } : null;

  // Define route categories for access control
  const adminRoutes = ['/dashboard', '/profile', '/analytics', '/bookings', '/calendar', '/customers', '/events', '/event-templates', '/feedback', '/inventory', '/marketing', '/menu-management', '/referrals', '/rewards', '/schedule', '/staff', '/tasks', '/visits', '/operations'];
  const customerRoutes = ['/customer'];
  
  const isAdminRoute = adminRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );
  const isCustomerRoute = customerRoutes.some(
    (route) =>
      req.nextUrl.pathname === route ||
      req.nextUrl.pathname.startsWith(`${route}/`)
  );
  const isProtectedRoute = isAdminRoute || isCustomerRoute;

  // Redirect unauthenticated users to login for protected routes
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect authenticated users away from login/register pages
  if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register')) {
    // Fetch user role from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    
    if (error || !profile) {
      if (process.env.NODE_ENV !== 'production') console.error('Error fetching user profile:', error);
      // Default to customer dashboard if profile not found
      return NextResponse.redirect(new URL('/customer/dashboard', req.url));
    }
    
    // Redirect based on user role
    if (profile.role === 'customer') {
      return NextResponse.redirect(new URL('/customer/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Fetch user role for role-based access control
  let role: string | null = null;
  if (session) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    
    if (error) {
      if (process.env.NODE_ENV !== 'production') console.error('Error fetching user profile in middleware:', error);
      // Allow access if profile fetch fails - let app handle the error
      return res;
    }
    
    if (profile) {
      role = profile.role;
    } else {
      if (process.env.NODE_ENV !== 'production') console.error('User profile not found for user:', session.user.id);
      // Allow access if no profile exists - let app handle the error
      return res;
    }
  }

  // Role-based access control
  if (session && role) {
    // Customers should only access customer routes
    if (role === 'customer' && isAdminRoute) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Customer ${session.user.id} attempted to access admin route: ${req.nextUrl.pathname}`);
      }
      return NextResponse.redirect(new URL('/customer/dashboard', req.url));
    }
    
    // Staff/Admin should only access admin routes (not customer routes)
    if ((role === 'staff' || role === 'admin') && isCustomerRoute) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Admin/Staff ${session.user.id} attempted to access customer route: ${req.nextUrl.pathname}`);
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    // If we get here, the access is allowed
  } else if (session && !role) {
    // Authenticated users without roles should be redirected to profile setup
    if (isProtectedRoute && req.nextUrl.pathname !== '/profile') {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`User ${session.user.id} has no role assigned, redirecting to profile`);
      }
      return NextResponse.redirect(new URL('/profile', req.url));
    }
  }

  return res;
}

// Configure middleware to run on specific routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/customer/:path*',
    '/profile',
    '/analytics/:path*',
    '/bookings/:path*',
    '/calendar/:path*',
    '/customers/:path*',
    '/events/:path*',
    '/event-templates/:path*',
    '/feedback/:path*',
    '/inventory/:path*',
    '/marketing/:path*',
    '/menu-management/:path*',
    '/referrals/:path*',
    '/rewards/:path*',
    '/schedule/:path*',
    '/staff/:path*',
    '/tasks/:path*',
    '/visits/:path*',
    '/operations',
    '/operations/:path*',
    '/login',
    '/register',
  ],
}; 