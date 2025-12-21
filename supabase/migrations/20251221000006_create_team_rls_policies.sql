-- RLS Policies for teams feature

-- ============================================
-- TEAMS TABLE POLICIES
-- ============================================

-- Team members can view their teams
create policy "Team members can view their teams"
  on public.teams for select
  using (
    id in (
      select team_id from public.team_members
      where user_id = auth.uid()
    )
  );

-- Authenticated users can create teams
create policy "Authenticated users can create teams"
  on public.teams for insert
  with check (auth.uid() is not null);

-- Team owners and admins can update team
create policy "Team owners and admins can update team"
  on public.teams for update
  using (
    id in (
      select team_id from public.team_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Only team owner can delete team
create policy "Only team owner can delete team"
  on public.teams for delete
  using (
    id in (
      select team_id from public.team_members
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- ============================================
-- TEAM MEMBERS TABLE POLICIES
-- ============================================

-- Team members can view other members
create policy "Team members can view other members"
  on public.team_members for select
  using (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid()
    )
  );

-- Team owner/admin can add members, or user can add self (accepting invite)
create policy "Team owner/admin can add members"
  on public.team_members for insert
  with check (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
    or
    -- Allow self-insert when accepting invite
    user_id = auth.uid()
  );

-- Team owner/admin can update members (not owner role)
create policy "Team owner/admin can update members"
  on public.team_members for update
  using (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
    and role != 'owner' -- Cannot modify owner
  );

-- Team owner/admin can remove members (not owner), or user can remove self
create policy "Team owner/admin can remove members"
  on public.team_members for delete
  using (
    (
      team_id in (
        select team_id from public.team_members
        where user_id = auth.uid() and role in ('owner', 'admin')
      )
      and role != 'owner'
    )
    or
    -- Allow self-removal (leaving team)
    user_id = auth.uid()
  );

-- ============================================
-- TEAM INVITATIONS TABLE POLICIES
-- ============================================

-- Team members can view invitations, users can view their email invites, anyone can view pending link invites
create policy "Users can view relevant invitations"
  on public.team_invitations for select
  using (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid()
    )
    or
    -- Allow viewing own email invitation
    email = (select email from auth.users where id = auth.uid())
    or
    -- Allow viewing pending link invites (for accepting)
    (status = 'pending' and invitation_type = 'link')
  );

-- Team owner/admin can create invitations
create policy "Team owner/admin can create invitations"
  on public.team_invitations for insert
  with check (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Team owner/admin can update invitations, or anyone can update to accept
create policy "Users can update invitations"
  on public.team_invitations for update
  using (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
    or
    -- Allow accepting invitations
    (status = 'pending' and auth.uid() is not null)
  );

-- Team owner/admin can delete invitations
create policy "Team owner/admin can delete invitations"
  on public.team_invitations for delete
  using (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- ============================================
-- TEAM LIMITS TABLE POLICIES
-- ============================================

-- Team members can view their team limits
create policy "Team members can view their team limits"
  on public.team_limits for select
  using (
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid()
    )
  );

-- Only allow insert during team creation (will be done via function)
create policy "Allow insert for authenticated users"
  on public.team_limits for insert
  with check (auth.uid() is not null);

-- ============================================
-- UPDATE ROOMS POLICIES FOR TEAM ROOMS
-- ============================================

-- Drop existing select policy and create new one that includes team rooms
drop policy if exists "Anyone can view rooms" on public.rooms;

create policy "Users can view public and team rooms"
  on public.rooms for select
  using (
    team_id is null -- public rooms
    or
    team_id in (
      select team_id from public.team_members
      where user_id = auth.uid()
    )
  );
