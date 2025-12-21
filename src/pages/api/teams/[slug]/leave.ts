import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../../lib/supabase';

// POST: Leave team
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

  // Get user's membership
  const { data: membership } = await supabase
    .from('team_members')
    .select('id, role')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return new Response(JSON.stringify({ error: 'You are not a member of this team' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Owner cannot leave - they must transfer ownership or delete the team
  if (membership.role === 'owner') {
    return new Response(JSON.stringify({
      error: 'As the owner, you cannot leave the team. Transfer ownership to another member or delete the team.'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Remove the membership
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', membership.id);

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
