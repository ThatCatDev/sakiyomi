import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../lib/supabase';

// GET: Get current user's profile
export const GET: APIRoute = async ({ request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ profile }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// PUT: Update current user's profile
export const PUT: APIRoute = async ({ request }) => {
  const supabase = createSupabaseServerClientFromRequest(request);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
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

  const { display_name, avatar_url } = body;

  // Validate display_name
  if (display_name !== undefined && display_name !== null) {
    if (typeof display_name !== 'string' || display_name.length > 100) {
      return new Response(JSON.stringify({ error: 'Display name must be 100 characters or less' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Validate avatar_url
  if (avatar_url !== undefined && avatar_url !== null && avatar_url !== '') {
    if (typeof avatar_url !== 'string' || avatar_url.length > 500) {
      return new Response(JSON.stringify({ error: 'Avatar URL must be 500 characters or less' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Basic URL validation
    try {
      new URL(avatar_url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid avatar URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Update profile (upsert in case it doesn't exist)
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      display_name: display_name?.trim() || null,
      avatar_url: avatar_url?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ profile }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
