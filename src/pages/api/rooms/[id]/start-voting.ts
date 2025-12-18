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

  if (participantError) {
    console.error('Error fetching participant:', participantError);
    return new Response(JSON.stringify({ error: 'Failed to verify role', details: participantError.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!participant || participant.role !== 'manager') {
    return new Response(JSON.stringify({ error: 'Only managers can start voting', role: participant?.role }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const formData = await request.formData();
  const topic = formData.get('topic') as string || null;

  // Clear all votes and set room to voting state
  const { error: clearError } = await supabase
    .from('room_participants')
    .update({ current_vote: null })
    .eq('room_id', roomId);

  if (clearError) {
    return new Response(JSON.stringify({ error: clearError.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error } = await supabase
    .from('rooms')
    .update({ voting_status: 'voting', current_topic: topic })
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
