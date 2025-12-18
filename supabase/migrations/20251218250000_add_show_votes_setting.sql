-- Add show_votes setting to rooms table
-- When true, all users can see who voted what after reveal
-- When false (default), only vote values are shown without names
alter table public.rooms
  add column show_votes boolean not null default false;
