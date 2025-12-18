import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase';

const protectedRoutes = ['/profile'];
const authRoutes = ['/login', '/signup'];

export const onRequest = defineMiddleware(async ({ cookies, url, redirect, request }, next) => {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const supabase = createSupabaseServerClient(cookies, cookieHeader);
  const { data: { user } } = await supabase.auth.getUser();

  const isProtectedRoute = protectedRoutes.some(route => url.pathname === route);
  const isAuthRoute = authRoutes.some(route => url.pathname === route);

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    return redirect('/login');
  }

  // Redirect to home if accessing auth routes while logged in
  if (isAuthRoute && user) {
    return redirect('/');
  }

  return next();
});
