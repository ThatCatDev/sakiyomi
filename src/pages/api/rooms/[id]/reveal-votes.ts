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
  const { data: participant } = await supabase
    .from('room_participants')
    .select('role')
    .eq('room_id', roomId)
    .eq('session_id', sessionId)
    .single();

  if (!participant || participant.role !== 'manager') {
    return new Response(JSON.stringify({ error: 'Only managers can reveal votes' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Set room to revealed state
  const { error } = await supabase
    .from('rooms')
    .update({ voting_status: 'revealed' })
    .eq('id', roomId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
