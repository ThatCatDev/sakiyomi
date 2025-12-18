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
