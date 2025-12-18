import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const supabase = createSupabaseServerClient(cookies, cookieHeader);

  const { data: { user } } = await supabase.auth.getUser();

  // Get or create session ID for tracking room creator
  let sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookies.set('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
  }

  const formData = await request.formData();
  const name = formData.get('name') as string || 'Planning Session';

  const { data: room, error } = await supabase
    .from('rooms')
    .insert({
      name,
      created_by: user?.id || null,
      creator_session_id: sessionId,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return redirect(`/room/${room.id}`);
};
