-- Add email column to profiles and sync from auth.users

-- Add email column
alter table public.profiles add column if not exists email text;

-- Update existing profiles with email from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id;

-- Update the handle_new_user function to also set email
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (NEW.id, NEW.email)
  on conflict (id) do update set email = NEW.email;
  return NEW;
end;
$$ language plpgsql security definer;
