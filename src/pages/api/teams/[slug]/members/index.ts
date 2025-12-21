import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../../../lib/supabase';

// GET: List team members
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

  // Get all members
  const { data: members, error } = await supabase
    .from('team_members')
    .select('id, user_id, role, joined_at')
    .eq('team_id', team.id)
    .order('joined_at', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ members }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
