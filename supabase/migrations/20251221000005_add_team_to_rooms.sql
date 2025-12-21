-- Add team_id to rooms table
-- Team rooms are always permanent and only accessible to team members

-- Add team_id column
alter table public.rooms
  add column team_id uuid references public.teams(id) on delete cascade;

-- Index for team rooms
create index rooms_team_id_idx on public.rooms(team_id) where team_id is not null;

-- Trigger: Team rooms are always permanent
create or replace function public.enforce_team_room_permanent()
returns trigger as $$
begin
  if NEW.team_id is not null then
    NEW.is_permanent := true;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger rooms_team_permanent_trigger
  before insert or update on public.rooms
  for each row execute function public.enforce_team_room_permanent();
