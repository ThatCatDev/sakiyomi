import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const { id: roomId } = params;
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const supabase = createSupabaseServerClient(cookies, cookieHeader);

  // Get session ID from cookie
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if requester is a manager
  const { data: requester } = await supabase
    .from('room_participants')
    .select('id, role')
    .eq('room_id', roomId)
    .eq('session_id', sessionId)
    .single();

  if (!requester || requester.role !== 'manager') {
    return new Response(JSON.stringify({ error: 'Only managers can promote participants' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get participant ID to promote from request body
  const body = await request.json();
  const { participantId } = body;

  if (!participantId) {
    return new Response(JSON.stringify({ error: 'Participant ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if target participant exists in this room
  const { data: targetParticipant } = await supabase
    .from('room_participants')
    .select('id, role')
    .eq('id', participantId)
    .eq('room_id', roomId)
    .single();

  if (!targetParticipant) {
    return new Response(JSON.stringify({ error: 'Participant not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (targetParticipant.role === 'manager') {
    return new Response(JSON.stringify({ error: 'Participant is already a manager' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Promote the participant to manager
  const { error } = await supabase
    .from('room_participants')
    .update({ role: 'manager' })
    .eq('id', participantId);

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
