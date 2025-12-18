import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

export const PUT: APIRoute = async ({ params, request, cookies }) => {
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
    return new Response(JSON.stringify({ error: 'Only managers can change room settings' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { name, showVotes, voteOptions } = body;

  // Validate inputs
  const updates: Record<string, unknown> = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Room name cannot be empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (name.length > 100) {
      return new Response(JSON.stringify({ error: 'Room name too long' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    updates.name = name.trim();
  }

  if (showVotes !== undefined) {
    if (typeof showVotes !== 'boolean') {
      return new Response(JSON.stringify({ error: 'showVotes must be a boolean' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    updates.show_votes = showVotes;
  }

  if (voteOptions !== undefined) {
    if (!Array.isArray(voteOptions) || voteOptions.length < 2) {
      return new Response(JSON.stringify({ error: 'At least 2 vote options are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (voteOptions.length > 20) {
      return new Response(JSON.stringify({ error: 'Maximum 20 vote options allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Validate each option
    for (const opt of voteOptions) {
      if (typeof opt !== 'string' || opt.length === 0 || opt.length > 5) {
        return new Response(JSON.stringify({ error: 'Each vote option must be 1-5 characters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    updates.vote_options = voteOptions;
  }

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ error: 'No valid updates provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update the room
  const { data: room, error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('id', roomId)
    .select('name, show_votes, vote_options')
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    name: room.name,
    showVotes: room.show_votes,
    voteOptions: room.vote_options,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
