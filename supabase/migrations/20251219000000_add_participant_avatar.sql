-- Add avatar fields to room_participants table
-- avatar_style: the DiceBear style (e.g., 'adventurer', 'bottts', 'fun-emoji')
-- avatar_seed: unique seed for generating the avatar

alter table room_participants
  add column avatar_style text default 'adventurer',
  add column avatar_seed text;

-- Set default seed to participant id for existing records
update room_participants set avatar_seed = id::text where avatar_seed is null;

-- Make avatar_seed not null after setting defaults
alter table room_participants
  alter column avatar_seed set default gen_random_uuid()::text;
