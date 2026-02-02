import { describe, it, expect } from 'vitest';
import { VALID_VOTES, getAvatarUrl, parseAvatarUrl } from './types';
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

  describe('getAvatarUrl', () => {
    it('should generate valid DiceBear URL with default size', () => {
      const url = getAvatarUrl('adventurer', 'test-seed');
      expect(url).toBe('https://api.dicebear.com/7.x/adventurer/svg?seed=test-seed&size=80');
    });

    it('should generate valid DiceBear URL with custom size', () => {
      const url = getAvatarUrl('bottts', 'my-seed', 120);
      expect(url).toBe('https://api.dicebear.com/7.x/bottts/svg?seed=my-seed&size=120');
    });

    it('should encode special characters in seed', () => {
      const url = getAvatarUrl('pixel-art', 'seed with spaces');
      expect(url).toBe('https://api.dicebear.com/7.x/pixel-art/svg?seed=seed%20with%20spaces&size=80');
    });
  });

  describe('parseAvatarUrl', () => {
    it('should parse valid DiceBear URL with version 7.x', () => {
      const url = 'https://api.dicebear.com/7.x/adventurer/svg?seed=test-seed&size=80';
      const result = parseAvatarUrl(url);
      expect(result).toEqual({ style: 'adventurer', seed: 'test-seed' });
    });

    it('should parse valid DiceBear URL with version 9.x', () => {
      const url = 'https://api.dicebear.com/9.x/bottts/svg?seed=my-seed';
      const result = parseAvatarUrl(url);
      expect(result).toEqual({ style: 'bottts', seed: 'my-seed' });
    });

    it('should decode URL-encoded seeds', () => {
      const url = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=seed%20with%20spaces';
      const result = parseAvatarUrl(url);
      expect(result).toEqual({ style: 'pixel-art', seed: 'seed with spaces' });
    });

    it('should return null for null input', () => {
      expect(parseAvatarUrl(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parseAvatarUrl(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseAvatarUrl('')).toBeNull();
    });

    it('should return null for non-DiceBear URLs', () => {
      expect(parseAvatarUrl('https://example.com/avatar.png')).toBeNull();
      expect(parseAvatarUrl('https://gravatar.com/avatar/123')).toBeNull();
    });

    it('should return null for malformed DiceBear URLs', () => {
      expect(parseAvatarUrl('https://api.dicebear.com/adventurer/svg')).toBeNull();
      expect(parseAvatarUrl('https://api.dicebear.com/7.x/adventurer')).toBeNull();
    });

    it('should handle complex seeds with special characters', () => {
      const url = 'https://api.dicebear.com/9.x/avataaars/svg?seed=user%40email.com';
      const result = parseAvatarUrl(url);
      expect(result).toEqual({ style: 'avataaars', seed: 'user@email.com' });
    });
  });
});
