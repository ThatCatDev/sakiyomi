// Room BLoC (Business Logic Component)
// Manages room state and coordinates between UI and API

import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { VotingStatus, Participant, RoomState, VoteResult } from './types';
import * as api from './api';

export type RoomEventType =
  | 'voting_status_changed'
  | 'topic_changed'
  | 'show_votes_changed'
  | 'vote_options_changed'
  | 'room_name_changed'
  | 'settings_changed'
  | 'participant_joined'
  | 'participant_left'
  | 'participant_updated'
  | 'participant_kicked'
  | 'role_changed'
  | 'vote_submitted'
  | 'kicked'
  | 'error';

export interface RoomEvent {
  type: RoomEventType;
  payload?: unknown;
}

type EventCallback = (event: RoomEvent) => void;

export class RoomBloc {
  private supabase: SupabaseClient;
  private participantsChannel: RealtimeChannel | null = null;
  private roomChannel: RealtimeChannel | null = null;
  private listeners: Set<EventCallback> = new Set();

  // State
  public roomId: string;
  public roomName: string;
  public votingStatus: VotingStatus;
  public currentTopic: string;
  public isManager: boolean;
  public currentParticipantId: string | null;
  public currentVote: string | null = null;
  public showVotes: boolean;
  public voteOptions: string[];

  constructor(
    supabaseUrl: string,
    supabaseAnonKey: string,
    initialState: RoomState & { currentVote?: string | null }
  ) {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    this.roomId = initialState.roomId;
    this.roomName = initialState.roomName;
    this.votingStatus = initialState.votingStatus;
    this.currentTopic = initialState.currentTopic;
    this.isManager = initialState.isManager;
    this.currentParticipantId = initialState.currentParticipantId;
    this.currentVote = initialState.currentVote || null;
    this.showVotes = initialState.showVotes;
    this.voteOptions = initialState.voteOptions;
  }

  // Event system
  subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(event: RoomEvent): void {
    this.listeners.forEach(callback => callback(event));
  }

  // Realtime subscriptions
  startRealtimeSubscription(): void {
    // Subscribe to participant changes
    this.participantsChannel = this.supabase
      .channel(`room-participants:${this.roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${this.roomId}`,
        },
        (payload) => {
          this.emit({
            type: 'participant_joined',
            payload: payload.new as Participant,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${this.roomId}`,
        },
        (payload) => {
          const participant = payload.new as Participant;

          // Update current vote if it's us
          if (participant.id === this.currentParticipantId) {
            this.currentVote = participant.current_vote;

            // Check if role changed to manager
            if (participant.role === 'manager' && !this.isManager) {
              this.isManager = true;
              this.emit({
                type: 'role_changed',
                payload: { isManager: true },
              });
            }

            // Check if role changed from manager (demoted)
            if (participant.role === 'member' && this.isManager) {
              this.isManager = false;
              this.emit({
                type: 'role_changed',
                payload: { isManager: false },
              });
            }
          }

          this.emit({
            type: 'participant_updated',
            payload: participant,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${this.roomId}`,
        },
        (payload) => {
          const deletedParticipant = payload.old as { id: string };

          // Check if the current user was kicked
          if (deletedParticipant.id === this.currentParticipantId) {
            this.emit({ type: 'kicked' });
            return;
          }

          this.emit({
            type: 'participant_left',
            payload: deletedParticipant,
          });
        }
      )
      .subscribe();

    // Subscribe to room changes
    this.roomChannel = this.supabase
      .channel(`room:${this.roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${this.roomId}`,
        },
        (payload) => {
          console.log('[RoomBloc] Room update received:', payload);
          const room = payload.new as {
            name: string;
            voting_status: VotingStatus;
            current_topic: string | null;
            show_votes: boolean;
            vote_options: string[];
          };

          const statusChanged = room.voting_status !== this.votingStatus;
          const topicChanged = room.current_topic !== this.currentTopic;
          const showVotesChanged = room.show_votes !== this.showVotes;
          const voteOptionsChanged = JSON.stringify(room.vote_options) !== JSON.stringify(this.voteOptions);
          const nameChanged = room.name !== this.roomName;

          console.log('[RoomBloc] Status changed:', statusChanged, 'from', this.votingStatus, 'to', room.voting_status);
          console.log('[RoomBloc] Topic changed:', topicChanged, 'from', this.currentTopic, 'to', room.current_topic);
          console.log('[RoomBloc] Show votes changed:', showVotesChanged, 'from', this.showVotes, 'to', room.show_votes);

          this.votingStatus = room.voting_status;
          this.currentTopic = room.current_topic || '';
          this.showVotes = room.show_votes;
          this.voteOptions = room.vote_options;
          this.roomName = room.name;

          if (statusChanged) {
            // Clear vote when new round starts
            if (room.voting_status === 'voting') {
              this.currentVote = null;
            }

            this.emit({
              type: 'voting_status_changed',
              payload: room.voting_status,
            });
          }

          if (topicChanged) {
            this.emit({
              type: 'topic_changed',
              payload: room.current_topic,
            });
          }

          if (showVotesChanged) {
            this.emit({
              type: 'show_votes_changed',
              payload: room.show_votes,
            });
          }

          if (voteOptionsChanged) {
            this.emit({
              type: 'vote_options_changed',
              payload: room.vote_options,
            });
          }

          if (nameChanged) {
            this.emit({
              type: 'room_name_changed',
              payload: room.name,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[RoomBloc] Room channel subscription status:', status);
      });
  }

  stopRealtimeSubscription(): void {
    if (this.participantsChannel) {
      this.supabase.removeChannel(this.participantsChannel);
      this.participantsChannel = null;
    }
    if (this.roomChannel) {
      this.supabase.removeChannel(this.roomChannel);
      this.roomChannel = null;
    }
  }

  // Actions
  async submitVote(vote: string): Promise<boolean> {
    if (this.votingStatus !== 'voting') {
      this.emit({ type: 'error', payload: 'Voting is not active' });
      return false;
    }

    // Optimistic update
    this.currentVote = vote;
    this.emit({ type: 'vote_submitted', payload: vote });

    const result = await api.submitVote(this.roomId, vote);

    if (!result.success) {
      this.emit({ type: 'error', payload: result.error });
      return false;
    }

    return true;
  }

  async startVoting(topic: string = ''): Promise<boolean> {
    console.log('[RoomBloc] startVoting called, isManager:', this.isManager);
    if (!this.isManager) {
      this.emit({ type: 'error', payload: 'Only managers can start voting' });
      return false;
    }

    const result = await api.startVoting(this.roomId, topic);
    console.log('[RoomBloc] startVoting API result:', result);

    if (!result.success) {
      this.emit({ type: 'error', payload: result.error });
      return false;
    }

    return true;
  }

  async revealVotes(): Promise<boolean> {
    if (!this.isManager) {
      this.emit({ type: 'error', payload: 'Only managers can reveal votes' });
      return false;
    }

    const result = await api.revealVotes(this.roomId);

    if (!result.success) {
      this.emit({ type: 'error', payload: result.error });
      return false;
    }

    return true;
  }

  async resetVotes(): Promise<boolean> {
    if (!this.isManager) {
      this.emit({ type: 'error', payload: 'Only managers can reset votes' });
      return false;
    }

    const result = await api.resetVotes(this.roomId);

    if (!result.success) {
      this.emit({ type: 'error', payload: result.error });
      return false;
    }

    return true;
  }

  async leaveRoom(): Promise<boolean> {
    const result = await api.leaveRoom(this.roomId);

    if (!result.success) {
      this.emit({ type: 'error', payload: result.error });
      return false;
    }

    return true;
  }

  async updateName(name: string): Promise<boolean> {
    const result = await api.updateName(this.roomId, name);

    if (!result.success) {
      this.emit({ type: 'error', payload: result.error });
      return false;
    }

    return true;
  }

  async toggleShowVotes(): Promise<boolean> {
    if (!this.isManager) {
      this.emit({ type: 'error', payload: 'Only managers can change this setting' });
      return false;
    }

    const result = await api.toggleShowVotes(this.roomId);

    if (!result.success) {
      this.emit({ type: 'error', payload: result.error });
      return false;
    }

    return true;
  }

  async promoteToManager(participantId: string): Promise<boolean> {
    if (!this.isManager) {
      this.emit({ type: 'error', payload: 'Only managers can promote participants' });
      return false;
    }

    const result = await api.promoteToManager(this.roomId, participantId);

    if (!result.success) {
      this.emit({ type: 'error', payload: result.error });
      return false;
    }

    return true;
  }

  async demoteFromManager(participantId: string): Promise<boolean> {
    if (!this.isManager) {
      this.emit({ type: 'error', payload: 'Only managers can demote participants' });
      return false;
    }

    const result = await api.demoteFromManager(this.roomId, participantId);

    if (!result.success) {
      this.emit({ type: 'error', payload: result.error });
      return false;
    }

    // If demoting self, update local state
    if (participantId === this.currentParticipantId) {
      this.isManager = false;
      this.emit({ type: 'role_changed', payload: { isManager: false } });
    }

    return true;
  }

  async kickParticipant(participantId: string): Promise<boolean> {
    if (!this.isManager) {
      this.emit({ type: 'error', payload: 'Only managers can kick participants' });
      return false;
    }

    if (participantId === this.currentParticipantId) {
      this.emit({ type: 'error', payload: 'You cannot kick yourself. Use leave instead.' });
      return false;
    }

    const result = await api.kickParticipant(this.roomId, participantId);

    if (!result.success) {
      this.emit({ type: 'error', payload: result.error });
      return false;
    }

    this.emit({ type: 'participant_kicked', payload: { participantId } });

    return true;
  }

  async updateSettings(settings: Partial<api.RoomSettingsData>): Promise<boolean> {
    if (!this.isManager) {
      this.emit({ type: 'error', payload: 'Only managers can change room settings' });
      return false;
    }

    const result = await api.updateRoomSettings(this.roomId, settings);

    if (!result.success) {
      this.emit({ type: 'error', payload: result.error });
      return false;
    }

    // Emit settings changed event with the new settings
    if (result.data) {
      this.emit({
        type: 'settings_changed',
        payload: result.data,
      });
    }

    return true;
  }

  // Utility functions
  static calculateResults(participants: { current_vote: string | null }[]): {
    results: VoteResult[];
    average: number | null;
  } {
    const votes: Record<string, number> = {};
    const numericVotes: number[] = [];
    const totalParticipants = participants.length;

    participants.forEach((p) => {
      if (p.current_vote) {
        votes[p.current_vote] = (votes[p.current_vote] || 0) + 1;
        const num = parseFloat(p.current_vote);
        if (!isNaN(num)) {
          numericVotes.push(num);
        }
      }
    });

    const results: VoteResult[] = Object.entries(votes)
      .map(([vote, count]) => ({
        vote,
        count,
        percentage: totalParticipants > 0 ? (count / totalParticipants) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const average = numericVotes.length > 0
      ? numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
      : null;

    return { results, average };
  }

  // Cleanup
  dispose(): void {
    this.stopRealtimeSubscription();
    this.listeners.clear();
  }
}
