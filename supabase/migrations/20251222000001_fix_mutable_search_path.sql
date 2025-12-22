-- Fix mutable search_path security issues for all public functions
-- This prevents search_path injection attacks by setting an immutable search_path

-- 1. check_team_member_limit
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
$$ language plpgsql set search_path = '';

-- 2. check_team_room_limit
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
$$ language plpgsql set search_path = '';

-- 3. get_team_role
create or replace function public.get_team_role(p_team_id uuid, p_user_id uuid)
returns team_role as $$
  select role from public.team_members
  where team_id = p_team_id and user_id = p_user_id;
$$ language sql security definer set search_path = '';

-- 4. create_team_with_owner
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
$$ language plpgsql security definer set search_path = '';

-- 5. accept_team_invitation
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
$$ language plpgsql security definer set search_path = '';

-- 6. generate_invite_token
create or replace function public.generate_invite_token()
returns text as $$
declare
  v_token text;
begin
  -- Generate a URL-safe token
  v_token := encode(extensions.gen_random_bytes(24), 'base64');
  -- Make it URL-safe
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
  return v_token;
end;
$$ language plpgsql set search_path = '';

-- 7. touch_room
create or replace function public.touch_room(room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.rooms
  set last_activity_at = now()
  where id = room_id;
end;
$$;

-- 8. cleanup_expired_rooms
create or replace function public.cleanup_expired_rooms(ttl_hours int default 1)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count int;
begin
  with deleted as (
    delete from public.rooms
    where last_activity_at < now() - (ttl_hours || ' hours')::interval
      and is_permanent = false
    returning id
  )
  select count(*) into deleted_count from deleted;

  return deleted_count;
end;
$$;

-- 9. update_room_activity_on_participant_change
create or replace function public.update_room_activity_on_participant_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.rooms
  set last_activity_at = now()
  where id = NEW.room_id;
  return NEW;
end;
$$;

-- 10. update_profile_updated_at
create or replace function public.update_profile_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql set search_path = '';

-- 11. handle_new_user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (NEW.id, NEW.email)
  on conflict (id) do update set email = NEW.email;
  return NEW;
end;
$$ language plpgsql security definer set search_path = '';

-- 12. is_team_member
create or replace function public.is_team_member(p_team_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = auth.uid()
  );
$$ language sql security definer set search_path = '';

-- 13. get_user_team_ids
create or replace function public.get_user_team_ids()
returns setof uuid as $$
  select team_id from public.team_members
  where user_id = auth.uid();
$$ language sql security definer set search_path = '';

-- 14. is_team_admin
create or replace function public.is_team_admin(p_team_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$ language sql security definer set search_path = '';

-- 15. enforce_team_room_permanent
create or replace function public.enforce_team_room_permanent()
returns trigger as $$
begin
  if NEW.team_id is not null then
    NEW.is_permanent := true;
  end if;
  return NEW;
end;
$$ language plpgsql set search_path = '';

-- 16. handle_updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql set search_path = '';
