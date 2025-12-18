-- Add is_permanent column to rooms table
alter table public.rooms
  add column is_permanent boolean default false not null;

-- Create index for efficient queries on permanent rooms
create index rooms_is_permanent_idx on public.rooms(is_permanent);

-- Update cleanup function to skip permanent rooms
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
      and is_permanent = false
    returning id
  )
  select count(*) into deleted_count from deleted;

  return deleted_count;
end;
$$;
