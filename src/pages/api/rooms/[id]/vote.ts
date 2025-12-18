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

  const formData = await request.formData();
  const vote = formData.get('vote') as string;

  // Validate vote value
  const validVotes = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];
  if (!vote || !validVotes.includes(vote)) {
    return new Response(JSON.stringify({ error: 'Invalid vote value' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check room is in voting state
  const { data: room } = await supabase
    .from('rooms')
    .select('voting_status')
    .eq('id', roomId)
    .single();

  if (!room || room.voting_status !== 'voting') {
    return new Response(JSON.stringify({ error: 'Voting is not active' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update participant's vote
  const { error } = await supabase
    .from('room_participants')
    .update({ current_vote: vote })
    .eq('room_id', roomId)
    .eq('session_id', sessionId);

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
