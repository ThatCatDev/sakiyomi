-- Fix invite page RLS issue
-- The teams table RLS blocks non-members from viewing team info,
-- but invite links need to show team info to potential members.
-- Solution: Create a SECURITY DEFINER function to fetch invite details.

create or replace function public.get_link_invitation(p_token text)
returns table (
  id uuid,
  team_id uuid,
  invitation_type invitation_type,
  role team_role,
  status invitation_status,
  expires_at timestamptz,
  max_uses int,
  use_count int,
  team_name text,
  team_slug text,
  team_avatar_url text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    i.id,
    i.team_id,
    i.invitation_type,
    i.role,
    i.status,
    i.expires_at,
    i.max_uses,
    i.use_count,
    t.name as team_name,
    t.slug as team_slug,
    t.avatar_url as team_avatar_url
  from public.team_invitations i
  join public.teams t on t.id = i.team_id
  where i.token = p_token
    and i.invitation_type = 'link';
end;
$$;

-- Grant execute to authenticated and anon users
grant execute on function public.get_link_invitation(text) to authenticated, anon;
