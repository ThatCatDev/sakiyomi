-- Enable pg_cron extension (available on Supabase paid plans)
-- If you're on the free plan, you'll need to call cleanup_expired_rooms() manually
-- or set up an external cron job

-- Uncomment the following if pg_cron is available:
-- create extension if not exists pg_cron;

-- Schedule cleanup to run every 15 minutes
-- This will delete rooms that haven't had activity in the last hour
-- Uncomment if pg_cron is available:
-- select cron.schedule(
--   'cleanup-expired-rooms',
--   '*/15 * * * *',  -- Every 15 minutes
--   $$select public.cleanup_expired_rooms(1)$$  -- 1 hour TTL
-- );

-- Alternative: Create a simple API endpoint that can be called by an external cron service
-- See /api/cron/cleanup-rooms.ts for the endpoint implementation
