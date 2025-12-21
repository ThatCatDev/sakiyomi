import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../../../lib/supabase';

// GET: List team invitations
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

  // Get pending invitations
  const { data: invitations, error } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('team_id', team.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ invitations }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST: Create invitation (email or link)
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
    return new Response(JSON.stringify({ error: 'Only owners and admins can create invitations' }), {
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

  const { type, email, role = 'member', expires_in_days, max_uses } = body;

  // Validate role
  if (!['admin', 'member'].includes(role)) {
    return new Response(JSON.stringify({ error: 'Role must be "admin" or "member"' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only owner can invite admins
  if (role === 'admin' && membership.role !== 'owner') {
    return new Response(JSON.stringify({ error: 'Only owners can invite admins' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (type === 'email') {
    // Email invitation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user is already a member
    const { data: existingUser } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team.id)
      .eq('user_id', (await supabase.from('auth.users').select('id').eq('email', email).single())?.data?.id)
      .single();

    // Check if there's already a pending invite for this email
    const { data: existingInvite } = await supabase
      .from('team_invitations')
      .select('id')
      .eq('team_id', team.id)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return new Response(JSON.stringify({ error: 'An invitation is already pending for this email' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create email invitation
    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: team.id,
        invited_by: user.id,
        email: email.toLowerCase(),
        invitation_type: 'email',
        role,
        expires_at: expires_in_days ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: Send email notification
    // For now, the invitation is created but email sending is not implemented

    return new Response(JSON.stringify(invitation), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } else if (type === 'link') {
    // Link invitation - generate a token
    const { data: token } = await supabase.rpc('generate_invite_token');

    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: invitation, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: team.id,
        invited_by: user.id,
        token,
        invitation_type: 'link',
        role,
        expires_at: expiresAt,
        max_uses: max_uses || null,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build the invite URL
    const baseUrl = new URL(request.url).origin;
    const inviteUrl = `${baseUrl}/invite/${token}`;

    return new Response(JSON.stringify({
      ...invitation,
      url: inviteUrl,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } else {
    return new Response(JSON.stringify({ error: 'Type must be "email" or "link"' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
