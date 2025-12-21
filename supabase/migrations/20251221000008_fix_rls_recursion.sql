-- Fix infinite recursion in RLS policies by using security definer functions

-- Create a function to check if user is a team member (bypasses RLS)
create or replace function public.is_team_member(p_team_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = auth.uid()
  );
$$ language sql security definer;

-- Create a function to get user's team IDs (bypasses RLS)
create or replace function public.get_user_team_ids()
returns setof uuid as $$
  select team_id from public.team_members
  where user_id = auth.uid();
$$ language sql security definer;

-- Create a function to check if user is team admin/owner
create or replace function public.is_team_admin(p_team_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$ language sql security definer;

-- Grant execute permissions
grant execute on function public.is_team_member(uuid) to authenticated;
grant execute on function public.get_user_team_ids() to authenticated;
grant execute on function public.is_team_admin(uuid) to authenticated;

-- ============================================
-- DROP AND RECREATE POLICIES
-- ============================================

-- Teams policies
drop policy if exists "Team members can view their teams" on public.teams;
create policy "Team members can view their teams"
  on public.teams for select
  using (public.is_team_member(id));

drop policy if exists "Team owners and admins can update team" on public.teams;
create policy "Team owners and admins can update team"
  on public.teams for update
  using (public.is_team_admin(id));

drop policy if exists "Only team owner can delete team" on public.teams;
create policy "Only team owner can delete team"
  on public.teams for delete
  using (
    exists (
      select 1 from public.team_members
      where team_id = id and user_id = auth.uid() and role = 'owner'
    )
  );

-- Team members policies
drop policy if exists "Team members can view other members" on public.team_members;
create policy "Team members can view other members"
  on public.team_members for select
  using (public.is_team_member(team_id));

drop policy if exists "Team owner/admin can add members" on public.team_members;
create policy "Team owner/admin can add members"
  on public.team_members for insert
  with check (
    public.is_team_admin(team_id)
    or user_id = auth.uid() -- Allow self-insert when accepting invite
  );

drop policy if exists "Team owner/admin can update members" on public.team_members;
create policy "Team owner/admin can update members"
  on public.team_members for update
  using (
    public.is_team_admin(team_id)
    and role != 'owner'
  );

drop policy if exists "Team owner/admin can remove members" on public.team_members;
create policy "Team owner/admin can remove members"
  on public.team_members for delete
  using (
    (public.is_team_admin(team_id) and role != 'owner')
    or user_id = auth.uid() -- Allow self-removal
  );

-- Team invitations policies
drop policy if exists "Users can view relevant invitations" on public.team_invitations;
create policy "Users can view relevant invitations"
  on public.team_invitations for select
  using (
    public.is_team_member(team_id)
    or (status = 'pending' and invitation_type = 'link')
  );

drop policy if exists "Team owner/admin can create invitations" on public.team_invitations;
create policy "Team owner/admin can create invitations"
  on public.team_invitations for insert
  with check (public.is_team_admin(team_id));

drop policy if exists "Users can update invitations" on public.team_invitations;
create policy "Users can update invitations"
  on public.team_invitations for update
  using (
    public.is_team_admin(team_id)
    or (status = 'pending' and auth.uid() is not null)
  );

drop policy if exists "Team owner/admin can delete invitations" on public.team_invitations;
create policy "Team owner/admin can delete invitations"
  on public.team_invitations for delete
  using (public.is_team_admin(team_id));

-- Team limits policies
drop policy if exists "Team members can view their team limits" on public.team_limits;
create policy "Team members can view their team limits"
  on public.team_limits for select
  using (public.is_team_member(team_id));

-- Rooms policies for team rooms
drop policy if exists "Users can view public and team rooms" on public.rooms;
create policy "Users can view public and team rooms"
  on public.rooms for select
  using (
    team_id is null
    or public.is_team_member(team_id)
  );
