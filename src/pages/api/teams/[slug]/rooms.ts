import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../../lib/supabase';

// GET: List team rooms
export const GET: APIRoute = async ({ params, request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);
  const { slug } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get team
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!team) {
    return new Response(JSON.stringify({ error: 'Team not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify user is a member
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return new Response(JSON.stringify({ error: 'You are not a member of this team' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get team rooms
  const { data: rooms, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('team_id', team.id)
    .order('last_activity_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ rooms }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST: Create team room
export const POST: APIRoute = async ({ params, request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);
  const { slug } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get team
  const { data: team } = await supabase
    .from('teams')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!team) {
    return new Response(JSON.stringify({ error: 'Team not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify user is owner or admin
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .single();

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    return new Response(JSON.stringify({ error: 'Only owners and admins can create team rooms' }), {
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

  const { name } = body;

  if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
    return new Response(JSON.stringify({ error: 'Room name must be 1-100 characters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create the room (team_id will automatically make it permanent via trigger)
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({
      name: name.trim(),
      team_id: team.id,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    // Check for limit error
    if (error.message.includes('limit reached')) {
      return new Response(JSON.stringify({ error: 'Team room limit reached. Upgrade your plan to create more rooms.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ id: room.id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
