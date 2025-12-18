import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const { id: roomId } = params;
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const supabase = createSupabaseServerClient(cookies, cookieHeader);

  const { data: { user } } = await supabase.auth.getUser();

  const formData = await request.formData();
  const name = formData.get('name') as string;

  if (!name || name.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get or create session ID from cookie
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

  // Fetch room to check if this user is the creator
  const { data: room } = await supabase
    .from('rooms')
    .select('creator_session_id')
    .eq('id', roomId)
    .single();

  // Determine role: manager if creator, otherwise member
  const isCreator = room?.creator_session_id === sessionId;
  const role = isCreator ? 'manager' : 'member';

  // Check if participant already exists
  const { data: existing } = await supabase
    .from('room_participants')
    .select('id')
    .eq('room_id', roomId)
    .eq('session_id', sessionId)
    .single();

  if (existing) {
    // Update existing participant name (keep existing role)
    const { error } = await supabase
      .from('room_participants')
      .update({ name: name.trim(), user_id: user?.id || null })
      .eq('id', existing.id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    // Create new participant with role
    const { error } = await supabase
      .from('room_participants')
      .insert({
        room_id: roomId,
        name: name.trim(),
        user_id: user?.id || null,
        session_id: sessionId,
        role,
      });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ success: true, sessionId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
