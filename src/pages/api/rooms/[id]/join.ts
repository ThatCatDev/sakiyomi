import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const { id: roomId } = params;
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const supabase = createSupabaseServerClient(cookies, cookieHeader);

  const { data: { user } } = await supabase.auth.getUser();

  const formData = await request.formData();
  const name = formData.get('name') as string;
  const avatarStyle = (formData.get('avatar_style') as string) || 'adventurer';
  const avatarSeed = (formData.get('avatar_seed') as string) || crypto.randomUUID();

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

  // Check if there's already a manager in the room
  const { data: existingManager } = await supabase
    .from('room_participants')
    .select('id')
    .eq('room_id', roomId)
    .eq('role', 'manager')
    .limit(1)
    .single();

  // Determine role: manager only if creator AND no existing manager
  const isCreator = room?.creator_session_id === sessionId;
  const role = (isCreator && !existingManager) ? 'manager' : 'member';

  // Check if participant already exists
  const { data: existing } = await supabase
    .from('room_participants')
    .select('id')
    .eq('room_id', roomId)
    .eq('session_id', sessionId)
    .single();

  if (existing) {
    // Update existing participant name and avatar (keep existing role)
    const { error } = await supabase
      .from('room_participants')
      .update({
        name: name.trim(),
        user_id: user?.id || null,
        avatar_style: avatarStyle,
        avatar_seed: avatarSeed,
      })
      .eq('id', existing.id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    // Create new participant with role and avatar
    const { error } = await supabase
      .from('room_participants')
      .insert({
        room_id: roomId,
        name: name.trim(),
        user_id: user?.id || null,
        session_id: sessionId,
        role,
        avatar_style: avatarStyle,
        avatar_seed: avatarSeed,
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
