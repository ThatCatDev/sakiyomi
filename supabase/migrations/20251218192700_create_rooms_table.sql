-- Create rooms table
create table public.rooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table public.rooms enable row level security;

-- Policies: anyone can read rooms, only authenticated users can create
create policy "Anyone can view rooms" on public.rooms
  for select using (true);

create policy "Authenticated users can create rooms" on public.rooms
  for insert with check (auth.uid() = created_by);

create policy "Room creators can update their rooms" on public.rooms
  for update using (auth.uid() = created_by);

create policy "Room creators can delete their rooms" on public.rooms
  for delete using (auth.uid() = created_by);
