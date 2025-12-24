-- Update handle_new_user to extract display_name from user metadata
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'
  )
  on conflict (id) do update set
    email = NEW.email,
    display_name = coalesce(
      NEW.raw_user_meta_data->>'display_name',
      public.profiles.display_name
    );
  return NEW;
end;
$$ language plpgsql security definer set search_path = '';
