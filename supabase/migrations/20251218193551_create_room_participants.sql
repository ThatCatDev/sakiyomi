-- Create room participants table for temporary users
create table public.room_participants (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  name text not null,
  user_id uuid references auth.users(id) on delete set null,
  session_id text not null,
  created_at timestamp with time zone default now() not null,

  -- Each session can only join a room once
  unique(room_id, session_id)
);

-- Enable RLS
alter table public.room_participants enable row level security;

-- Anyone can view participants in a room
create policy "Anyone can view room participants" on public.room_participants
  for select using (true);

-- Anyone can join a room (insert)
create policy "Anyone can join a room" on public.room_participants
  for insert with check (true);

-- Participants can update their own record (by session_id)
create policy "Participants can update own record" on public.room_participants
  for update using (true);

-- Participants can leave (delete their own record)
create policy "Participants can leave room" on public.room_participants
  for delete using (true);

-- Index for faster lookups
create index room_participants_room_id_idx on public.room_participants(room_id);
create index room_participants_session_id_idx on public.room_participants(session_id);
