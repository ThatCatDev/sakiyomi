import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../lib/supabase';

// GET: List user's teams
export const GET: APIRoute = async ({ request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get teams with membership info
  const { data: memberships, error } = await supabase
    .from('team_members')
    .select(`
      role,
      teams (
        id,
        name,
        slug,
        avatar_url,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get member counts for each team
  const teamIds = memberships?.map(m => (m.teams as any)?.id).filter(Boolean) || [];

  let memberCounts: Record<string, number> = {};
  if (teamIds.length > 0) {
    const { data: counts } = await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds);

    if (counts) {
      memberCounts = counts.reduce((acc, { team_id }) => {
        acc[team_id] = (acc[team_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
  }

  const teams = memberships?.map(m => ({
    ...(m.teams as any),
    role: m.role,
    member_count: memberCounts[(m.teams as any)?.id] || 0,
  })) || [];

  return new Response(JSON.stringify({ teams }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST: Create new team
export const POST: APIRoute = async ({ request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
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

  const { name, slug } = body;

  // Validate name
  if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
    return new Response(JSON.stringify({ error: 'Name must be 1-100 characters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Validate slug format
  if (!slug || typeof slug !== 'string') {
    return new Response(JSON.stringify({ error: 'Slug is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  if (!slugRegex.test(slug) || slug.length < 3 || slug.length > 50) {
    return new Response(JSON.stringify({
      error: 'Slug must be 3-50 characters, lowercase alphanumeric with hyphens, starting and ending with alphanumeric'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check slug availability
  const { data: existing } = await supabase
    .from('teams')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return new Response(JSON.stringify({ error: 'This slug is already taken' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create team with owner using RPC function
  const { data: teamId, error } = await supabase.rpc('create_team_with_owner', {
    p_name: name.trim(),
    p_slug: slug,
  });

  if (error) {
    // Handle duplicate slug error
    if (error.message.includes('duplicate key') || error.message.includes('teams_slug_key')) {
      return new Response(JSON.stringify({ error: 'This team URL is already taken. Please choose a different one.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ id: teamId, slug }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
