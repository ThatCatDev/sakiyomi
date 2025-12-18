import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (code) {
    const response = new Response();
    const supabase = createSupabaseServerClientFromRequest(request, response);

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return new Response(null, {
        status: 302,
        headers: {
          ...Object.fromEntries(response.headers),
          Location: '/',
        },
      });
    }
  }

  return redirect('/login?error=auth_callback_error');
};
