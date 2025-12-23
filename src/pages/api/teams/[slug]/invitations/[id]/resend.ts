import type { APIRoute } from 'astro';
import { createSupabaseServerClientFromRequest } from '../../../../../../lib/supabase';
import { sendEmail, getTeamInviteEmail } from '../../../../../../lib/email';

// POST: Resend invitation email
export const POST: APIRoute = async ({ params, request }) => {
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
    .select('id, name')
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
    return new Response(JSON.stringify({ error: 'Only owners and admins can resend invitations' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get the invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('id', invitationId)
    .eq('team_id', team.id)
    .single();

  if (inviteError || !invitation) {
    return new Response(JSON.stringify({ error: 'Invitation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (invitation.status !== 'pending') {
    return new Response(JSON.stringify({ error: 'Invitation is no longer pending' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (invitation.invitation_type !== 'email' || !invitation.email) {
    return new Response(JSON.stringify({ error: 'Only email invitations can be resent' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // If invitation doesn't have a token, generate one
  let token = invitation.token;
  if (!token) {
    const { data: newToken, error: tokenError } = await supabase.rpc('generate_invite_token');
    if (tokenError) {
      console.error('Failed to generate token:', tokenError);
      return new Response(JSON.stringify({ error: 'Failed to generate invite token' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    token = newToken;

    // Update the invitation with the new token
    const { error: updateError } = await supabase
      .from('team_invitations')
      .update({ token, max_uses: 1 })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Failed to update invitation with token:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update invitation' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Get inviter's profile
  const { data: inviterProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  // Send the email
  const baseUrl = new URL(request.url).origin;
  const inviteUrl = `${baseUrl}/invite/${token}`;
  const inviterName = inviterProfile?.display_name || user.email?.split('@')[0] || 'Someone';

  try {
    const emailContent = getTeamInviteEmail({
      teamName: team.name,
      inviterName,
      role: invitation.role,
      inviteUrl,
      siteUrl: baseUrl,
    });

    await sendEmail({
      to: invitation.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (emailError) {
    console.error('Failed to resend invitation email:', emailError);
    return new Response(JSON.stringify({ error: 'Failed to send email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
