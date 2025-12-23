-- Update team limits: 30 members per team, 10 rooms per team

-- Update default values for new teams
alter table public.team_limits
  alter column max_members set default 30,
  alter column max_active_rooms set default 10;

-- Update existing teams to new limits
update public.team_limits
set max_members = 30, max_active_rooms = 10
where max_members < 30 or max_active_rooms < 10;
