-- Fix performance issues identified by Supabase Database Advisor

-- ============================================
-- ADD MISSING INDEXES ON FOREIGN KEY COLUMNS
-- ============================================

-- Index on room_participants.user_id (foreign key to auth.users)
create index if not exists room_participants_user_id_idx
  on public.room_participants(user_id);

-- Index on rooms.created_by (foreign key to auth.users)
create index if not exists rooms_created_by_idx
  on public.rooms(created_by);

-- Index on team_invitations.accepted_by (foreign key to auth.users)
create index if not exists team_invitations_accepted_by_idx
  on public.team_invitations(accepted_by)
  where accepted_by is not null;

-- Index on team_invitations.invited_by (foreign key to auth.users)
create index if not exists team_invitations_invited_by_idx
  on public.team_invitations(invited_by);

-- ============================================
-- REMOVE DUPLICATE INDEXES
-- ============================================

-- teams_slug_idx duplicates teams_slug_key (unique constraint index)
drop index if exists public.teams_slug_idx;

-- team_invitations_token_idx duplicates team_invitations_token_key (unique constraint index)
drop index if exists public.team_invitations_token_idx;

-- team_limits_team_id_idx duplicates team_limits_team_id_key (unique constraint index)
drop index if exists public.team_limits_team_id_idx;

-- ============================================
-- FIX RLS POLICY BUG
-- ============================================

-- The "Only team owner can delete team" policy has a bug:
-- It compares team_members.team_id = team_members.id (wrong)
-- Should compare team_members.team_id = teams.id

drop policy if exists "Only team owner can delete team" on public.teams;
create policy "Only team owner can delete team"
  on public.teams for delete
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
        and team_members.user_id = auth.uid()
        and team_members.role = 'owner'
    )
  );
