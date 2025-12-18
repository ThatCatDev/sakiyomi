-- Add last_activity_at column for TTL tracking
alter table public.rooms
  add column last_activity_at timestamp with time zone default now() not null;

-- Update existing rooms to have last_activity_at = created_at
update public.rooms set last_activity_at = created_at;

-- Create index for efficient cleanup queries
create index rooms_last_activity_at_idx on public.rooms(last_activity_at);

-- Function to update room activity timestamp
create or replace function public.touch_room(room_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.rooms
  set last_activity_at = now()
  where id = room_id;
end;
$$;

-- Grant execute to authenticated and anon users
grant execute on function public.touch_room(uuid) to authenticated, anon;

-- Function to clean up expired rooms (default 1 hour TTL)
create or replace function public.cleanup_expired_rooms(ttl_hours int default 1)
returns int
language plpgsql
security definer
as $$
declare
  deleted_count int;
begin
  with deleted as (
    delete from public.rooms
    where last_activity_at < now() - (ttl_hours || ' hours')::interval
    returning id
  )
  select count(*) into deleted_count from deleted;

  return deleted_count;
end;
$$;

-- Grant execute only to service role (for cron jobs)
grant execute on function public.cleanup_expired_rooms(int) to service_role;

-- Automatically update last_activity_at when participants join/update
create or replace function public.update_room_activity_on_participant_change()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.rooms
  set last_activity_at = now()
  where id = NEW.room_id;
  return NEW;
end;
$$;

-- Trigger for participant insert/update
create trigger on_participant_change
  after insert or update on public.room_participants
  for each row
  execute function public.update_room_activity_on_participant_change();
