import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Update the last_activity_at timestamp for a room.
 * Call this when any action is performed in the room.
 *
 * Note: Participant join/update already triggers this automatically via database trigger.
 * Use this for other actions like voting, revealing, etc.
 */
export async function touchRoom(supabase: SupabaseClient, roomId: string): Promise<void> {
  await supabase.rpc('touch_room', { room_id: roomId });
}
