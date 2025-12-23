-- Fix RLS policy for rooms to allow realtime updates
-- The realtime subscription uses anon role, so we need to allow anon to SELECT rooms
-- Authorization is handled at the API level

-- Drop the team-based select policy
drop policy if exists "Users can view public and team rooms" on public.rooms;

-- Allow anyone to view any room (auth is handled at API/page level)
create policy "Anyone can view rooms" on public.rooms
  for select using (true);
