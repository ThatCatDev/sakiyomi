import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../../lib/supabase';

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const { id: roomId } = params;
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const supabase = createSupabaseServerClient(cookies, cookieHeader);

  const { data: { user } } = await supabase.auth.getUser();

  const formData = await request.formData();
  const name = formData.get('name') as string;
  const avatarStyle = (formData.get('avatar_style') as string) || 'adventurer';
  const avatarSeed = (formData.get('avatar_seed') as string) || crypto.randomUUID();

  if (!name || name.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'Name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get or create session ID from cookie
  let sessionId = cookies.get('session_id')?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookies.set('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
  }

  // Fetch room to check if this user is the creator and if it belongs to a team
  const { data: room } = await supabase
    .from('rooms')
    .select('creator_session_id, team_id')
    .eq('id', roomId)
    .single();

  // Check if there's already a manager in the room
  const { data: existingManager } = await supabase
    .from('room_participants')
    .select('id')
    .eq('room_id', roomId)
    .eq('role', 'manager')
    .limit(1)
    .single();

  // Check if user is a team admin/owner for this room's team
  let isTeamAdmin = false;
  if (user && room?.team_id) {
    const { data: membership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', room.team_id)
      .eq('user_id', user.id)
      .single();

    isTeamAdmin = membership?.role === 'owner' || membership?.role === 'admin';
  }

  // Determine role:
  // - Non-team rooms: creator is always manager
  // - Team rooms: team admins/owners are managers
  const isCreator = room?.creator_session_id === sessionId;
  const isTeamRoom = !!room?.team_id;
  const shouldBeManager = isTeamRoom ? isTeamAdmin : isCreator;
  const role = shouldBeManager ? 'manager' : 'member';

  // Try to insert new participant
  const { error: insertError } = await supabase
    .from('room_participants')
    .insert({
      room_id: roomId,
      name: name.trim(),
      user_id: user?.id || null,
      session_id: sessionId,
      role,
      avatar_style: avatarStyle,
      avatar_seed: avatarSeed,
    });

  // If duplicate key error, update existing participant instead
  if (insertError?.code === '23505') {
    // Build update object - include role promotion for team admins
    const updateData: Record<string, unknown> = {
      name: name.trim(),
      user_id: user?.id || null,
      avatar_style: avatarStyle,
      avatar_seed: avatarSeed,
    };

    // Promote to manager if they should be one (but don't demote existing managers)
    if (shouldBeManager) {
      updateData.role = 'manager';
    }

    const { error: updateError } = await supabase
      .from('room_participants')
      .update(updateData)
      .eq('room_id', roomId)
      .eq('session_id', sessionId);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, sessionId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
