-- Helper functions for team operations

-- ============================================
-- LIMIT CHECKING FUNCTIONS
-- ============================================

-- Function to check team member count against limit
create or replace function public.check_team_member_limit()
returns trigger as $$
declare
  member_count integer;
  max_members integer;
begin
  select count(*) into member_count
  from public.team_members
  where team_id = NEW.team_id;

  select tl.max_members into max_members
  from public.team_limits tl
  where tl.team_id = NEW.team_id;

  if max_members is not null and member_count >= max_members then
    raise exception 'Team member limit reached (% of %)', member_count, max_members;
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger team_members_limit_check
  before insert on public.team_members
  for each row execute function public.check_team_member_limit();

-- Function to check team room count against limit
create or replace function public.check_team_room_limit()
returns trigger as $$
declare
  room_count integer;
  max_rooms integer;
begin
  if NEW.team_id is null then
    return NEW;
  end if;

  select count(*) into room_count
  from public.rooms
  where team_id = NEW.team_id;

  select tl.max_active_rooms into max_rooms
  from public.team_limits tl
  where tl.team_id = NEW.team_id;

  if max_rooms is not null and room_count >= max_rooms then
    raise exception 'Team room limit reached (% of %)', room_count, max_rooms;
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger rooms_team_limit_check
  before insert on public.rooms
  for each row execute function public.check_team_room_limit();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user's role in a team
create or replace function public.get_team_role(p_team_id uuid, p_user_id uuid)
returns team_role as $$
  select role from public.team_members
  where team_id = p_team_id and user_id = p_user_id;
$$ language sql security definer;

-- Function to create team with owner (atomic operation)
create or replace function public.create_team_with_owner(
  p_name text,
  p_slug text,
  p_avatar_url text default null
)
returns uuid as $$
declare
  v_team_id uuid;
begin
  -- Insert team
  insert into public.teams (name, slug, avatar_url, created_by)
  values (p_name, p_slug, p_avatar_url, auth.uid())
  returning id into v_team_id;

  -- Add creator as owner
  insert into public.team_members (team_id, user_id, role)
  values (v_team_id, auth.uid(), 'owner');

  -- Create default limits
  insert into public.team_limits (team_id)
  values (v_team_id);

  return v_team_id;
end;
$$ language plpgsql security definer;

-- Function to accept invitation
create or replace function public.accept_team_invitation(p_token text)
returns table(team_id uuid, team_slug text) as $$
declare
  v_invitation record;
  v_team record;
begin
  -- Get and lock the invitation
  select * into v_invitation
  from public.team_invitations
  where token = p_token
    and invitation_type = 'link'
    and status = 'pending'
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
        when max_uses is not null and use_count + 1 >= max_uses then 'accepted'::invitation_status
        else status
      end
  where id = v_invitation.id;

  -- Get team info
  select id, slug into v_team
  from public.teams
  where id = v_invitation.team_id;

  return query select v_team.id, v_team.slug;
end;
$$ language plpgsql security definer;

-- Function to generate secure token
create or replace function public.generate_invite_token()
returns text as $$
declare
  v_token text;
begin
  -- Generate a URL-safe token
  v_token := encode(gen_random_bytes(24), 'base64');
  -- Make it URL-safe
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
  return v_token;
end;
$$ language plpgsql;

-- Grant execute permissions
grant execute on function public.create_team_with_owner(text, text, text) to authenticated;
grant execute on function public.accept_team_invitation(text) to authenticated;
grant execute on function public.get_team_role(uuid, uuid) to authenticated;
grant execute on function public.generate_invite_token() to authenticated;
