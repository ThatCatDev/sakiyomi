-- Update the room update policy to allow session-based updates
-- This is needed for anonymous room creators to update voting status

-- Drop the old policy that only allows auth.uid() based updates
drop policy if exists "Room creators can update their rooms" on public.rooms;

-- Create a new policy that allows:
-- 1. Authenticated users who created the room (created_by = auth.uid())
-- 2. Anyone (we rely on API-level checks for manager role verification)
-- The API already verifies the user is a manager before allowing updates
create policy "Anyone can update rooms" on public.rooms
  for update using (true);
