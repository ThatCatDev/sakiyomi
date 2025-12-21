-- Create team_invitations table
-- Supports both email invites and shareable link invites

-- Create enums for invitation types and status
create type public.invitation_type as enum ('email', 'link');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');

create table public.team_invitations (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  invited_by uuid references auth.users(id) on delete set null,

  -- For email invites
  email text,

  -- For link invites
  token text unique,

  invitation_type invitation_type not null,
  role team_role default 'member' not null,
  status invitation_status default 'pending' not null,

  expires_at timestamp with time zone,
  max_uses integer, -- for link invites (null = unlimited)
  use_count integer default 0 not null,

  created_at timestamp with time zone default now() not null,
  accepted_at timestamp with time zone,
  accepted_by uuid references auth.users(id) on delete set null,

  -- Constraints: email invites need email, link invites need token
  constraint email_or_token_required check (
    (invitation_type = 'email' and email is not null) or
    (invitation_type = 'link' and token is not null)
  )
);

-- Indexes
create index team_invitations_team_id_idx on public.team_invitations(team_id);
create index team_invitations_email_idx on public.team_invitations(email) where email is not null;
create unique index team_invitations_token_idx on public.team_invitations(token) where token is not null;
create index team_invitations_status_idx on public.team_invitations(status);

-- Enable RLS
alter table public.team_invitations enable row level security;
