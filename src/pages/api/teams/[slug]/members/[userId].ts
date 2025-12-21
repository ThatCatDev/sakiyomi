import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../../../lib/supabase';
import { ROLE_HIERARCHY } from '../../../../../lib/team/types';

// PUT: Update member role
export const PUT: APIRoute = async ({ params, request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);
  const { slug, userId: targetUserId } = params;

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

  // Get requester's membership
  const { data: requesterMembership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .single();

  if (!requesterMembership) {
    return new Response(JSON.stringify({ error: 'You are not a member of this team' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only owner and admin can update roles
  if (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Only owners and admins can change roles' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get target member's current role
  const { data: targetMembership } = await supabase
    .from('team_members')
    .select('id, role')
    .eq('team_id', team.id)
    .eq('user_id', targetUserId)
    .single();

  if (!targetMembership) {
    return new Response(JSON.stringify({ error: 'Member not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Cannot modify owner role
  if (targetMembership.role === 'owner') {
    return new Response(JSON.stringify({ error: 'Cannot change the owner\'s role' }), {
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

  const { role: newRole } = body;

  // Validate new role
  if (!newRole || !['admin', 'member'].includes(newRole)) {
    return new Response(JSON.stringify({ error: 'Role must be "admin" or "member"' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only owner can promote to admin
  if (newRole === 'admin' && requesterMembership.role !== 'owner') {
    return new Response(JSON.stringify({ error: 'Only owners can promote members to admin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Admins can only demote other admins if they have higher privilege (they don't)
  if (targetMembership.role === 'admin' && requesterMembership.role === 'admin') {
    return new Response(JSON.stringify({ error: 'Admins cannot change other admin roles' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update the role
  const { error } = await supabase
    .from('team_members')
    .update({ role: newRole })
    .eq('id', targetMembership.id);

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

// DELETE: Remove member from team
export const DELETE: APIRoute = async ({ params, request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);
  const { slug, userId: targetUserId } = params;

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

  // Get requester's membership
  const { data: requesterMembership } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .single();

  if (!requesterMembership) {
    return new Response(JSON.stringify({ error: 'You are not a member of this team' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get target member
  const { data: targetMembership } = await supabase
    .from('team_members')
    .select('id, role')
    .eq('team_id', team.id)
    .eq('user_id', targetUserId)
    .single();

  if (!targetMembership) {
    return new Response(JSON.stringify({ error: 'Member not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Cannot remove owner
  if (targetMembership.role === 'owner') {
    return new Response(JSON.stringify({ error: 'Cannot remove the team owner' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check permissions - must be owner/admin OR removing self
  const isSelfRemoval = user.id === targetUserId;
  const isOwnerOrAdmin = requesterMembership.role === 'owner' || requesterMembership.role === 'admin';

  if (!isSelfRemoval && !isOwnerOrAdmin) {
    return new Response(JSON.stringify({ error: 'You do not have permission to remove this member' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Admins cannot remove other admins
  if (targetMembership.role === 'admin' && requesterMembership.role === 'admin' && !isSelfRemoval) {
    return new Response(JSON.stringify({ error: 'Admins cannot remove other admins' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Remove the member
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', targetMembership.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(null, { status: 204 });
};
