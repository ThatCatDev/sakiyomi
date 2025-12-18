import { describe, it, expect } from 'vitest';
import { VALID_VOTES } from './types';
import type { VotingStatus, ParticipantRole, Room, Participant, VoteResult } from './types';

describe('Room Types', () => {
  describe('VALID_VOTES', () => {
    it('should contain fibonacci-like story point values', () => {
      expect(VALID_VOTES).toContain('0');
      expect(VALID_VOTES).toContain('1');
      expect(VALID_VOTES).toContain('2');
      expect(VALID_VOTES).toContain('3');
      expect(VALID_VOTES).toContain('5');
      expect(VALID_VOTES).toContain('8');
      expect(VALID_VOTES).toContain('13');
      expect(VALID_VOTES).toContain('21');
    });

    it('should contain special votes', () => {
      expect(VALID_VOTES).toContain('?');
      expect(VALID_VOTES).toContain('☕');
    });

    it('should have exactly 10 vote options', () => {
      expect(VALID_VOTES).toHaveLength(10);
    });
  });

  describe('Type guards', () => {
    it('VotingStatus should accept valid values', () => {
      const validStatuses: VotingStatus[] = ['waiting', 'voting', 'revealed'];
      expect(validStatuses).toHaveLength(3);
    });

    it('ParticipantRole should accept valid values', () => {
      const validRoles: ParticipantRole[] = ['manager', 'member'];
      expect(validRoles).toHaveLength(2);
    });
  });

  describe('Room interface', () => {
    it('should accept a valid room object', () => {
      const room: Room = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Room',
        voting_status: 'waiting',
        current_topic: null,
        creator_session_id: 'session-123',
        created_by: null,
        created_at: '2024-01-01T00:00:00Z',
        last_activity_at: '2024-01-01T00:00:00Z',
      };

      expect(room.id).toBeDefined();
      expect(room.name).toBe('Test Room');
      expect(room.voting_status).toBe('waiting');
    });
  });

  describe('Participant interface', () => {
    it('should accept a valid participant object', () => {
      const participant: Participant = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        room_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test User',
        role: 'manager',
        current_vote: '5',
        user_id: null,
        session_id: 'session-123',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(participant.name).toBe('Test User');
      expect(participant.role).toBe('manager');
      expect(participant.current_vote).toBe('5');
    });

    it('should allow null current_vote', () => {
      const participant: Participant = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        room_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test User',
        role: 'member',
        current_vote: null,
        user_id: null,
        session_id: 'session-123',
        created_at: '2024-01-01T00:00:00Z',
      };

      expect(participant.current_vote).toBeNull();
    });
  });

  describe('VoteResult interface', () => {
    it('should accept a valid vote result', () => {
      const result: VoteResult = {
        vote: '5',
        count: 3,
        percentage: 50,
      };

      expect(result.vote).toBe('5');
      expect(result.count).toBe(3);
      expect(result.percentage).toBe(50);
    });
  });
});
