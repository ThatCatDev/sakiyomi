-- Set REPLICA IDENTITY FULL so DELETE events include the old record data
-- This is required for Supabase Realtime to broadcast the full deleted row
alter table public.room_participants replica identity full;
