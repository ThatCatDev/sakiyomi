-- Add custom vote options to rooms table
-- Default is the standard fibonacci-like sequence used in story poker

alter table public.rooms
  add column vote_options text[] not null default array['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'];
