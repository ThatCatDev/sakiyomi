import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClientFromRequest } from './lib/supabase';

const protectedRoutes = ['/profile', '/teams'];
const protectedPrefixes = ['/teams/'];
const authRoutes = ['/login', '/signup'];

export const onRequest = defineMiddleware(async ({ url, redirect, request }, next) => {
  const supabase = createSupabaseServerClientFromRequest(request);
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
