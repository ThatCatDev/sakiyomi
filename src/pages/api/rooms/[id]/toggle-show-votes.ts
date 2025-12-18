import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const { id: roomId } = params;
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const supabase = createSupabaseServerClient(cookies, cookieHeader);

  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Not in room' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify user is a manager
  const { data: participant, error: participantError } = await supabase
    .from('room_participants')
    .select('role')
    .eq('room_id', roomId)
    .eq('session_id', sessionId)
    .single();

  if (participantError || !participant || participant.role !== 'manager') {
    return new Response(JSON.stringify({ error: 'Only managers can change this setting' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get current show_votes value
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('show_votes')
    .eq('id', roomId)
    .single();

  if (roomError || !room) {
    return new Response(JSON.stringify({ error: 'Room not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Toggle the value
  const newValue = !room.show_votes;

  const { error } = await supabase
    .from('rooms')
    .update({ show_votes: newValue })
    .eq('id', roomId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, showVotes: newValue }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
