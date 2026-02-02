// Room-related types

export type VotingStatus = 'waiting' | 'voting' | 'revealed';
export type ParticipantRole = 'manager' | 'member';

export interface Room {
  id: string;
  name: string;
  voting_status: VotingStatus;
  current_topic: string | null;
  creator_session_id: string | null;
  created_by: string | null;
  created_at: string;
  last_activity_at: string;
  show_votes: boolean;
  vote_options: string[];
}

export interface Participant {
  id: string;
  room_id: string;
  name: string;
  role: ParticipantRole;
  current_vote: string | null;
  user_id: string | null;
  session_id: string;
  created_at: string;
  avatar_style: string;
  avatar_seed: string;
}

// Available DiceBear avatar styles
export const AVATAR_STYLES = [
  'adventurer',
  'adventurer-neutral',
  'avataaars',
  'avataaars-neutral',
  'big-ears',
  'big-ears-neutral',
  'big-smile',
  'bottts',
  'bottts-neutral',
  'croodles',
  'croodles-neutral',
  'fun-emoji',
  'icons',
  'identicon',
  'lorelei',
  'lorelei-neutral',
  'micah',
  'miniavs',
  'notionists',
  'notionists-neutral',
  'open-peeps',
  'personas',
  'pixel-art',
  'pixel-art-neutral',
  'shapes',
  'thumbs',
] as const;

export type AvatarStyle = typeof AVATAR_STYLES[number];

// Helper to generate DiceBear avatar URL
export function getAvatarUrl(style: string, seed: string, size = 80): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}

// Helper to parse DiceBear avatar URL and extract style and seed
export function parseAvatarUrl(url: string | null | undefined): { style: string; seed: string } | null {
  if (!url) return null;

  const match = url.match(/api\.dicebear\.com\/\d+\.x\/([^/]+)\/svg\?seed=([^&]+)/);
  if (!match) return null;

  return {
    style: match[1],
    seed: decodeURIComponent(match[2]),
  };
}

export interface RoomState {
  roomId: string;
  roomName: string;
  votingStatus: VotingStatus;
  currentTopic: string;
  isManager: boolean;
  currentParticipantId: string | null;
  showVotes: boolean;
  voteOptions: string[];
}

export interface RoomSettings {
  name: string;
  showVotes: boolean;
  voteOptions: string[];
}

export interface VoteResult {
  vote: string;
  count: number;
  percentage: number;
}

export const VALID_VOTES = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'] as const;
export type ValidVote = typeof VALID_VOTES[number];
