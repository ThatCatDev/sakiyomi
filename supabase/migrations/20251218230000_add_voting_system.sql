-- Add role to room_participants (manager controls voting, member votes)
alter table public.room_participants
  add column role text not null default 'member' check (role in ('manager', 'member'));

-- Add current_vote to track each participant's vote
alter table public.room_participants
  add column current_vote text;

-- Add voting state to rooms table
-- voting_status: 'waiting' (no active vote), 'voting' (collecting votes), 'revealed' (votes shown)
alter table public.rooms
  add column voting_status text not null default 'waiting' check (voting_status in ('waiting', 'voting', 'revealed'));

-- Add current_topic to rooms (what we're voting on)
alter table public.rooms
  add column current_topic text;

-- Track who created the room by session_id (for anonymous room creators)
alter table public.rooms
  add column creator_session_id text;

-- Enable realtime for rooms table (for voting_status changes)
alter publication supabase_realtime add table public.rooms;

-- Set REPLICA IDENTITY FULL on rooms for realtime updates
alter table public.rooms replica identity full;
