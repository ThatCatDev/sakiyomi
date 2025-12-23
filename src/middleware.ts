import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

const protectedRoutes = ['/profile', '/teams'];
const protectedPrefixes = ['/teams/'];
const authRoutes = ['/login', '/signup'];

export const onRequest = defineMiddleware(async ({ url, redirect, request, cookies }, next) => {
  // Create a response-aware supabase client for cookie handling
  const responseCookies: { name: string; value: string; options?: any }[] = [];

  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(cookie => {
            responseCookies.push(cookie);
            cookies.set(cookie.name, cookie.value, cookie.options);
          });
        },
      },
    }
  );

  // Handle PKCE code exchange from Supabase auth callback
  const code = url.searchParams.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth code exchange error:', error.message);
      // Redirect to login with error message
      return redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    if (data.session) {
      // Remove code from URL and redirect
      const cleanUrl = new URL(url);
      cleanUrl.searchParams.delete('code');
      return redirect(cleanUrl.pathname || '/');
    }
  }

  const { data: { user } } = await supabase.auth.getUser();

  const isProtectedRoute = protectedRoutes.some(route => url.pathname === route) ||
    protectedPrefixes.some(prefix => url.pathname.startsWith(prefix));
  const isAuthRoute = authRoutes.some(route => url.pathname === route);

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const redirectUrl = encodeURIComponent(url.pathname + url.search);
    return redirect(`/login?redirect=${redirectUrl}`);
  }

  // Redirect to home if accessing auth routes while logged in
  if (isAuthRoute && user) {
    return redirect('/');
  }

  return next();
});
