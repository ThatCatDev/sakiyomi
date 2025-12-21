import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../lib/supabase';

// GET: Get invitation info (for displaying invite page)
export const GET: APIRoute = async ({ params, request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);
  const { token } = params;

  // Get invitation with team info
  const { data: invitation, error } = await supabase
    .from('team_invitations')
    .select(`
      id,
      team_id,
      invitation_type,
      role,
      status,
      expires_at,
      max_uses,
      use_count,
      teams (
        id,
        name,
        slug,
        avatar_url
      )
    `)
    .eq('token', token)
    .eq('invitation_type', 'link')
    .single();

  if (error || !invitation) {
    return new Response(JSON.stringify({ error: 'Invitation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if invitation is valid
  if (invitation.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'This invitation is no longer valid' }), {
      status: 410,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: 'This invitation has expired' }), {
      status: 410,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (invitation.max_uses !== null && invitation.use_count >= invitation.max_uses) {
    return new Response(JSON.stringify({ error: 'This invitation has reached its maximum uses' }), {
      status: 410,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    team: invitation.teams,
    role: invitation.role,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST: Accept invitation
export const POST: APIRoute = async ({ params, request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);
  const { token } = params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'You must be signed in to accept an invitation' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Use the RPC function to accept the invitation atomically
  const { data, error } = await supabase.rpc('accept_team_invitation', {
    p_token: token,
  });

  if (error) {
    // Parse common errors
    if (error.message.includes('Invalid or expired')) {
      return new Response(JSON.stringify({ error: 'This invitation is invalid or has expired' }), {
        status: 410,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (error.message.includes('already a member')) {
      return new Response(JSON.stringify({ error: 'You are already a member of this team' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (error.message.includes('limit reached')) {
      return new Response(JSON.stringify({ error: 'This team has reached its member limit' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get the team slug from the result
  const result = data?.[0];

  return new Response(JSON.stringify({
    team_slug: result?.team_slug,
    message: 'Successfully joined the team',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
