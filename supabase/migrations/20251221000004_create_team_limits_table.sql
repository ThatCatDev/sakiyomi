-- Create team_limits table
-- Tracks usage limits per team (for free tier and future paid plans)

create table public.team_limits (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null unique,

  -- Limits (null = unlimited)
  max_members integer default 5,
  max_active_rooms integer default 3,

  -- Plan info (for future paid tiers)
  plan_name text default 'free' not null,
  plan_expires_at timestamp with time zone,

  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Index
create unique index team_limits_team_id_idx on public.team_limits(team_id);

-- Enable RLS
alter table public.team_limits enable row level security;

-- Trigger for updated_at
create trigger team_limits_updated_at
  before update on public.team_limits
  for each row execute function public.handle_updated_at();
