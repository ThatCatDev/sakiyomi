import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';
import { AVATAR_STYLES } from '../../../../lib/room/types';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const roomId = params.id;
  const sessionId = cookies.get('session_id')?.value;

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'No session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cookieHeader = request.headers.get('Cookie') ?? '';
  const supabase = createSupabaseServerClient(cookies, cookieHeader);

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { avatarStyle, avatarSeed } = body;

  // Validate inputs
  if (!avatarStyle || typeof avatarStyle !== 'string') {
    return new Response(JSON.stringify({ error: 'avatarStyle is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!avatarSeed || typeof avatarSeed !== 'string') {
    return new Response(JSON.stringify({ error: 'avatarSeed is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate avatar style (allow any style for flexibility)
  if (avatarStyle.length > 50) {
    return new Response(JSON.stringify({ error: 'Invalid avatar style' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate avatar seed length
  if (avatarSeed.length > 100) {
    return new Response(JSON.stringify({ error: 'Avatar seed too long' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update participant avatar
  const { data: participant, error } = await supabase
    .from('room_participants')
    .update({
      avatar_style: avatarStyle,
      avatar_seed: avatarSeed,
    })
    .eq('room_id', roomId)
    .eq('session_id', sessionId)
    .select('id, avatar_style, avatar_seed')
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!participant) {
    return new Response(JSON.stringify({ error: 'Participant not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    avatarStyle: participant.avatar_style,
    avatarSeed: participant.avatar_seed,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
