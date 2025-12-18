import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

// This endpoint is called by Vercel Cron or external cron services
// Protected by CRON_SECRET environment variable

const handler: APIRoute = async ({ request }) => {
  // Verify cron secret to prevent unauthorized access
  // Vercel sends this as 'Authorization: Bearer <CRON_SECRET>'
  const authHeader = request.headers.get('Authorization');
  const cronSecret = import.meta.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Use service role key for cleanup (bypasses RLS)
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Service role key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get TTL from query params or default to 1 hour
  const url = new URL(request.url);
  const ttlHours = parseInt(url.searchParams.get('ttl') || '1', 10);

  // Call the cleanup function
  const { data, error } = await supabase.rpc('cleanup_expired_rooms', {
    ttl_hours: ttlHours,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    deleted_count: data,
    ttl_hours: ttlHours,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Vercel crons use GET, but also support POST for manual triggers
export const GET = handler;
export const POST = handler;
