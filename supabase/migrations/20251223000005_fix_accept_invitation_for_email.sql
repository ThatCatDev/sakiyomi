-- Fix accept_team_invitation to also accept email invitations with tokens
-- Email invitations now have tokens so they can be accepted via the same flow

create or replace function public.accept_team_invitation(p_token text)
returns table (team_id uuid, team_slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation record;
  v_team record;
begin
  -- Get and lock the invitation (now accepts both link and email types)
  select * into v_invitation
  from public.team_invitations
  where token = p_token
    and status = 'pending'::public.invitation_status
    and (expires_at is null or expires_at > now())
    and (max_uses is null or use_count < max_uses)
  for update;

  if v_invitation is null then
    raise exception 'Invalid or expired invitation';
  end if;

  -- Check if user is already a member
  if exists (
    select 1 from public.team_members
    where team_members.team_id = v_invitation.team_id
      and user_id = auth.uid()
  ) then
    raise exception 'You are already a member of this team';
  end if;

  -- Add user to team
  insert into public.team_members (team_id, user_id, role)
  values (v_invitation.team_id, auth.uid(), v_invitation.role);

  -- Update invitation
  update public.team_invitations
  set use_count = use_count + 1,
      accepted_at = now(),
      accepted_by = auth.uid(),
      status = case
        when max_uses is not null and use_count + 1 >= max_uses then 'accepted'::public.invitation_status
        else status
      end
  where id = v_invitation.id;

  -- Get team info for return
  select t.id, t.slug into v_team
  from public.teams t
  where t.id = v_invitation.team_id;

  return query select v_team.id, v_team.slug;
end;
$$;
