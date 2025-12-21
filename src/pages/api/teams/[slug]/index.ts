import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../../lib/supabase';

// Helper to get team and verify membership
async function getTeamWithAuth(supabase: any, slug: string, userId: string) {
  // Get team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('slug', slug)
    .single();

  if (teamError || !team) {
    return { error: 'Team not found', status: 404 };
  }

  // Get user's membership
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', team.id)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    return { error: 'You are not a member of this team', status: 403 };
  }

  return { team, role: membership.role };
}

// GET: Get team details
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

  const result = await getTeamWithAuth(supabase, slug!, user.id);
  if ('error' in result) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { team, role } = result;

  // Get members with user info
  const { data: members } = await supabase
    .from('team_members')
    .select('id, user_id, role, joined_at')
    .eq('team_id', team.id)
    .order('joined_at', { ascending: true });

  // Get user emails for members
  const userIds = members?.map(m => m.user_id) || [];
  let userEmails: Record<string, string> = {};

  if (userIds.length > 0) {
    // Note: This requires a service role or admin access to get user emails
    // For now, we'll just include the user_id and let the client handle it
    // In production, you'd want a users table or use Supabase admin API
  }

  // Get limits
  const { data: limits } = await supabase
    .from('team_limits')
    .select('*')
    .eq('team_id', team.id)
    .single();

  // Get room count
  const { count: roomCount } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', team.id);

  return new Response(JSON.stringify({
    ...team,
    members: members || [],
    limits,
    room_count: roomCount || 0,
    current_user_role: role,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT: Update team
export const PUT: APIRoute = async ({ params, request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);
  const { slug } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await getTeamWithAuth(supabase, slug!, user.id);
  if ('error' in result) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { team, role } = result;

  // Only owner and admin can update
  if (role !== 'owner' && role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Only owners and admins can update the team' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const updates: Record<string, unknown> = {};

  // Validate and add name if provided
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 1 || body.name.trim().length > 100) {
      return new Response(JSON.stringify({ error: 'Name must be 1-100 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    updates.name = body.name.trim();
  }

  // Add avatar_url if provided
  if (body.avatar_url !== undefined) {
    updates.avatar_url = body.avatar_url;
  }

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: updatedTeam, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', team.id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(updatedTeam), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// DELETE: Delete team
export const DELETE: APIRoute = async ({ params, request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);
  const { slug } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await getTeamWithAuth(supabase, slug!, user.id);
  if ('error' in result) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { team, role } = result;

  // Only owner can delete
  if (role !== 'owner') {
    return new Response(JSON.stringify({ error: 'Only the owner can delete the team' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', team.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(null, { status: 204 });
};
