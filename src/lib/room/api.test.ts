import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as api from './api';

describe('Room API', () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('submitVote', () => {
    it('should submit a vote successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await api.submitVote('room-123', '5');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/rooms/room-123/vote',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should return error on failed vote', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Voting is not active' }),
      });

      const result = await api.submitVote('room-123', '5');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Voting is not active');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await api.submitVote('room-123', '5');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('startVoting', () => {
    it('should start voting with a topic', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await api.startVoting('room-123', 'User Story #1');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/rooms/room-123/start-voting',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should start voting without a topic', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await api.startVoting('room-123', '');

      expect(result.success).toBe(true);
    });

    it('should return error when not a manager', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Only managers can start voting' }),
      });

      const result = await api.startVoting('room-123', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only managers can start voting');
    });
  });

  describe('revealVotes', () => {
    it('should reveal votes successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await api.revealVotes('room-123');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/rooms/room-123/reveal-votes',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should return error when not a manager', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Only managers can reveal votes' }),
      });

      const result = await api.revealVotes('room-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only managers can reveal votes');
    });
  });

  describe('resetVotes', () => {
    it('should reset votes successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await api.resetVotes('room-123');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/rooms/room-123/reset-votes',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('joinRoom', () => {
    it('should join a room successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, sessionId: 'session-123' }),
      });

      const result = await api.joinRoom('room-123', 'Test User');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true, sessionId: 'session-123' });
    });

    it('should return error for empty name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Name is required' }),
      });

      const result = await api.joinRoom('room-123', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Name is required');
    });
  });

  describe('leaveRoom', () => {
    it('should leave a room successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await api.leaveRoom('room-123');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/rooms/room-123/leave',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('updateName', () => {
    it('should update name successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await api.updateName('room-123', 'New Name');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/rooms/room-123/update-name',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });
});
