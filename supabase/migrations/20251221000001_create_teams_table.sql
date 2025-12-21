-- Create teams table
-- Teams are organizations that can own permanent rooms

create table public.teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  avatar_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,

  -- Constraints
  constraint teams_slug_format check (
    slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    and length(slug) >= 3
    and length(slug) <= 50
  ),
  constraint teams_name_length check (
    length(name) >= 1 and length(name) <= 100
  )
);

-- Indexes
create unique index teams_slug_idx on public.teams(slug);
create index teams_created_by_idx on public.teams(created_by);

-- Enable RLS
alter table public.teams enable row level security;

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Trigger for updated_at
create trigger teams_updated_at
  before update on public.teams
  for each row execute function public.handle_updated_at();

-- Enable realtime
alter publication supabase_realtime add table public.teams;
