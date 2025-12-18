import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const { id: roomId } = params;
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const supabase = createSupabaseServerClient(cookies, cookieHeader);

  // Get session ID from cookie
  const sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Not in room' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if leaving participant is a manager
  const { data: leavingParticipant } = await supabase
    .from('room_participants')
    .select('id, role')
    .eq('room_id', roomId)
    .eq('session_id', sessionId)
    .single();

  if (leavingParticipant?.role === 'manager') {
    // Find another participant to promote to manager
    const { data: otherParticipants } = await supabase
      .from('room_participants')
      .select('id')
      .eq('room_id', roomId)
      .neq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (otherParticipants && otherParticipants.length > 0) {
      // Promote the oldest participant to manager
      await supabase
        .from('room_participants')
        .update({ role: 'manager' })
        .eq('id', otherParticipants[0].id);
    }
  }

  // Delete participant
  const { error } = await supabase
    .from('room_participants')
    .delete()
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
