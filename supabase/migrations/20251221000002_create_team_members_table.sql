-- Create team_members table
-- Links users to teams with their role

-- Create enum for team roles
create type public.team_role as enum ('owner', 'admin', 'member');

create table public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role team_role default 'member' not null,
  joined_at timestamp with time zone default now() not null,

  -- Each user can only be in a team once
  unique(team_id, user_id)
);

-- Indexes
create index team_members_team_id_idx on public.team_members(team_id);
create index team_members_user_id_idx on public.team_members(user_id);

-- Enable RLS
alter table public.team_members enable row level security;

-- Enable realtime
alter publication supabase_realtime add table public.team_members;
