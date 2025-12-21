import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../../../lib/supabase';

// DELETE: Revoke invitation
export const DELETE: APIRoute = async ({ params, request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);
  const { slug, id: invitationId } = params;

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
    return new Response(JSON.stringify({ error: 'Only owners and admins can revoke invitations' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get invitation
  const { data: invitation } = await supabase
    .from('team_invitations')
    .select('id, team_id, status')
    .eq('id', invitationId)
    .single();

  if (!invitation || invitation.team_id !== team.id) {
    return new Response(JSON.stringify({ error: 'Invitation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (invitation.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Can only revoke pending invitations' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update status to revoked
  const { error } = await supabase
    .from('team_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(null, { status: 204 });
};
