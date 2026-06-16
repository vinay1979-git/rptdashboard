import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const url = request.nextUrl.clone();
    const isAuthPage = url.pathname === '/login';
    const isProtectedPage = 
      url.pathname.startsWith('/dashboard') || 
      url.pathname.startsWith('/admin') || 
      url.pathname.startsWith('/report');

    if (isProtectedPage && !isAuthPage) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // Define route classifications
  const isAuthPage = url.pathname === '/login';
  const isProtectedPage = 
    url.pathname.startsWith('/dashboard') || 
    url.pathname.startsWith('/admin') || 
    url.pathname.startsWith('/report');

  // Unauthenticated user trying to access protected page
  if (!user && isProtectedPage) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated user trying to access login page
  if (user && isAuthPage) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Enforce admin routing rules for /admin sub-pages
  if (user && url.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.is_admin) {
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, SVGs)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
