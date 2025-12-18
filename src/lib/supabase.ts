import { createBrowserClient, createServerClient, parseCookieHeader, type CookieOptions } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createSupabaseServerClient(cookies: AstroCookies, cookieHeader?: string) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          // Parse all cookies from header if provided, otherwise get from AstroCookies
          if (cookieHeader) {
            return parseCookieHeader(cookieHeader);
          }
          // Get all Supabase-related cookies
          const allCookies: { name: string; value: string }[] = [];
          // Supabase stores auth in cookies prefixed with sb-
          const cookieNames = ['sb-access-token', 'sb-refresh-token'];
          for (const header of cookies.headers()) {
            const parsed = parseCookieHeader(header);
            allCookies.push(...parsed);
          }
          return allCookies;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookies.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );
}

export function createSupabaseServerClientFromRequest(request: Request, response: Response) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(request.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.headers.append('Set-Cookie', `${name}=${value}; Path=${options?.path ?? '/'}; HttpOnly; SameSite=Lax`);
          });
        },
      },
    }
  );
}
