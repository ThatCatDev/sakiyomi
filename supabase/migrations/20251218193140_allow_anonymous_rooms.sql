-- Make created_by optional for anonymous room creation
alter table public.rooms alter column created_by drop not null;

-- Update insert policy to allow anyone to create rooms
drop policy "Authenticated users can create rooms" on public.rooms;

create policy "Anyone can create rooms" on public.rooms
  for insert with check (true);
