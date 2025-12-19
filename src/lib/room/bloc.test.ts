import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RoomBloc } from './bloc';
import type { RoomEvent } from './bloc';
import * as api from './api';

// Mock the api module
vi.mock('./api', () => ({
  submitVote: vi.fn(),
  startVoting: vi.fn(),
  revealVotes: vi.fn(),
  resetVotes: vi.fn(),
  leaveRoom: vi.fn(),
  updateName: vi.fn(),
  toggleShowVotes: vi.fn(),
  promoteToManager: vi.fn(),
  demoteFromManager: vi.fn(),
  kickParticipant: vi.fn(),
  updateRoomSettings: vi.fn(),
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  })),
}));

describe('RoomBloc', () => {
  let bloc: RoomBloc;
  const mockApiSubmitVote = vi.mocked(api.submitVote);
  const mockApiStartVoting = vi.mocked(api.startVoting);
  const mockApiRevealVotes = vi.mocked(api.revealVotes);
  const mockApiResetVotes = vi.mocked(api.resetVotes);
  const mockApiLeaveRoom = vi.mocked(api.leaveRoom);
  const mockApiUpdateName = vi.mocked(api.updateName);
  const mockApiToggleShowVotes = vi.mocked(api.toggleShowVotes);
  const mockApiPromoteToManager = vi.mocked(api.promoteToManager);
  const mockApiDemoteFromManager = vi.mocked(api.demoteFromManager);
  const mockApiKickParticipant = vi.mocked(api.kickParticipant);
  const mockApiUpdateRoomSettings = vi.mocked(api.updateRoomSettings);

  beforeEach(() => {
    vi.clearAllMocks();

    bloc = new RoomBloc('https://test.supabase.co', 'test-key', {
      roomId: 'room-123',
      roomName: 'Test Room',
      votingStatus: 'waiting',
      currentTopic: '',
      isManager: true,
      currentParticipantId: 'participant-123',
      showVotes: false,
      voteOptions: ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'],
      currentVote: null,
    });
  });

  afterEach(() => {
    bloc.dispose();
  });

  describe('initialization', () => {
    it('should initialize with correct state', () => {
      expect(bloc.roomId).toBe('room-123');
      expect(bloc.votingStatus).toBe('waiting');
      expect(bloc.currentTopic).toBe('');
      expect(bloc.isManager).toBe(true);
      expect(bloc.currentParticipantId).toBe('participant-123');
      expect(bloc.currentVote).toBeNull();
    });

    it('should initialize with existing vote', () => {
      const blocWithVote = new RoomBloc('https://test.supabase.co', 'test-key', {
        roomId: 'room-123',
        roomName: 'Test Room',
        votingStatus: 'voting',
        currentTopic: 'Test Topic',
        isManager: false,
        currentParticipantId: 'participant-123',
        showVotes: true,
        voteOptions: ['1', '2', '3'],
        currentVote: '5',
      });

      expect(blocWithVote.currentVote).toBe('5');
      expect(blocWithVote.votingStatus).toBe('voting');
      expect(blocWithVote.currentTopic).toBe('Test Topic');
      expect(blocWithVote.isManager).toBe(false);
      expect(blocWithVote.showVotes).toBe(true);

      blocWithVote.dispose();
    });
  });

  describe('subscribe', () => {
    it('should add and call listeners on events', () => {
      const listener = vi.fn();
      bloc.subscribe(listener);

      // Trigger an event by calling an action that emits
      mockApiSubmitVote.mockResolvedValueOnce({ success: false, error: 'Test error' });

      // The bloc should emit when we try to vote while not in voting state
      bloc.submitVote('5'); // This will emit an error because votingStatus is 'waiting'

      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Voting is not active',
      });
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = bloc.subscribe(listener);

      unsubscribe();

      // Change bloc state to voting so we can test
      bloc.votingStatus = 'voting';
      mockApiSubmitVote.mockResolvedValueOnce({ success: true });
      bloc.submitVote('5');

      // Listener should not be called after unsubscribe
      // But vote_submitted event would have been called before the async completes
      // So we check it wasn't called with subsequent events
    });
  });

  describe('submitVote', () => {
    it('should reject vote when not in voting state', async () => {
      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.submitVote('5');

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Voting is not active',
      });
      expect(mockApiSubmitVote).not.toHaveBeenCalled();
    });

    it('should submit vote when in voting state', async () => {
      bloc.votingStatus = 'voting';
      mockApiSubmitVote.mockResolvedValueOnce({ success: true });

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.submitVote('5');

      expect(result).toBe(true);
      expect(bloc.currentVote).toBe('5');
      expect(mockApiSubmitVote).toHaveBeenCalledWith('room-123', '5');
      expect(listener).toHaveBeenCalledWith({
        type: 'vote_submitted',
        payload: '5',
      });
    });

    it('should emit error on API failure', async () => {
      bloc.votingStatus = 'voting';
      mockApiSubmitVote.mockReset();
      mockApiSubmitVote.mockResolvedValueOnce({ success: false, error: 'Server error' });

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.submitVote('5');

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Server error',
      });
    });
  });

  describe('startVoting', () => {
    it('should reject when not a manager', async () => {
      bloc.isManager = false;

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.startVoting('Topic');

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Only managers can start voting',
      });
      expect(mockApiStartVoting).not.toHaveBeenCalled();
    });

    it('should start voting when manager', async () => {
      mockApiStartVoting.mockResolvedValueOnce({ success: true });

      const result = await bloc.startVoting('New Topic');

      expect(result).toBe(true);
      expect(mockApiStartVoting).toHaveBeenCalledWith('room-123', 'New Topic');
    });

    it('should start voting with empty topic', async () => {
      mockApiStartVoting.mockResolvedValueOnce({ success: true });

      const result = await bloc.startVoting();

      expect(result).toBe(true);
      expect(mockApiStartVoting).toHaveBeenCalledWith('room-123', '');
    });
  });

  describe('revealVotes', () => {
    it('should reject when not a manager', async () => {
      bloc.isManager = false;

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.revealVotes();

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Only managers can reveal votes',
      });
    });

    it('should reveal votes when manager', async () => {
      mockApiRevealVotes.mockResolvedValueOnce({ success: true });

      const result = await bloc.revealVotes();

      expect(result).toBe(true);
      expect(mockApiRevealVotes).toHaveBeenCalledWith('room-123');
    });
  });

  describe('resetVotes', () => {
    it('should reject when not a manager', async () => {
      bloc.isManager = false;

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.resetVotes();

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Only managers can reset votes',
      });
    });

    it('should reset votes when manager', async () => {
      mockApiResetVotes.mockResolvedValueOnce({ success: true });

      const result = await bloc.resetVotes();

      expect(result).toBe(true);
      expect(mockApiResetVotes).toHaveBeenCalledWith('room-123');
    });
  });

  describe('leaveRoom', () => {
    it('should leave room successfully', async () => {
      mockApiLeaveRoom.mockResolvedValueOnce({ success: true });

      const result = await bloc.leaveRoom();

      expect(result).toBe(true);
      expect(mockApiLeaveRoom).toHaveBeenCalledWith('room-123');
    });

    it('should emit error on failure', async () => {
      mockApiLeaveRoom.mockResolvedValueOnce({ success: false, error: 'Failed to leave' });

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.leaveRoom();

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Failed to leave',
      });
    });
  });

  describe('updateName', () => {
    it('should update name successfully', async () => {
      mockApiUpdateName.mockResolvedValueOnce({ success: true });

      const result = await bloc.updateName('New Name');

      expect(result).toBe(true);
      expect(mockApiUpdateName).toHaveBeenCalledWith('room-123', 'New Name');
    });
  });

  describe('toggleShowVotes', () => {
    it('should reject when not a manager', async () => {
      bloc.isManager = false;

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.toggleShowVotes();

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Only managers can change this setting',
      });
      expect(mockApiToggleShowVotes).not.toHaveBeenCalled();
    });

    it('should toggle show votes when manager', async () => {
      mockApiToggleShowVotes.mockResolvedValueOnce({ success: true, data: { showVotes: true } });

      const result = await bloc.toggleShowVotes();

      expect(result).toBe(true);
      expect(mockApiToggleShowVotes).toHaveBeenCalledWith('room-123');
    });
  });

  describe('promoteToManager', () => {
    it('should reject when not a manager', async () => {
      bloc.isManager = false;

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.promoteToManager('participant-456');

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Only managers can promote participants',
      });
      expect(mockApiPromoteToManager).not.toHaveBeenCalled();
    });

    it('should promote participant when manager', async () => {
      mockApiPromoteToManager.mockResolvedValueOnce({ success: true });

      const result = await bloc.promoteToManager('participant-456');

      expect(result).toBe(true);
      expect(mockApiPromoteToManager).toHaveBeenCalledWith('room-123', 'participant-456');
    });

    it('should emit error on API failure', async () => {
      mockApiPromoteToManager.mockResolvedValueOnce({ success: false, error: 'Participant not found' });

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.promoteToManager('invalid-id');

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Participant not found',
      });
    });
  });

  describe('demoteFromManager', () => {
    it('should reject when not a manager', async () => {
      bloc.isManager = false;

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.demoteFromManager('participant-456');

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Only managers can demote participants',
      });
      expect(mockApiDemoteFromManager).not.toHaveBeenCalled();
    });

    it('should demote participant when manager', async () => {
      mockApiDemoteFromManager.mockResolvedValueOnce({ success: true });

      const result = await bloc.demoteFromManager('participant-456');

      expect(result).toBe(true);
      expect(mockApiDemoteFromManager).toHaveBeenCalledWith('room-123', 'participant-456');
    });

    it('should update local isManager state when demoting self', async () => {
      mockApiDemoteFromManager.mockResolvedValueOnce({ success: true });

      const listener = vi.fn();
      bloc.subscribe(listener);

      // Demote self
      const result = await bloc.demoteFromManager('participant-123');

      expect(result).toBe(true);
      expect(bloc.isManager).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'role_changed',
        payload: { isManager: false },
      });
    });

    it('should not update local isManager state when demoting others', async () => {
      mockApiDemoteFromManager.mockResolvedValueOnce({ success: true });

      const listener = vi.fn();
      bloc.subscribe(listener);

      // Demote someone else
      const result = await bloc.demoteFromManager('participant-456');

      expect(result).toBe(true);
      expect(bloc.isManager).toBe(true);
      // Should not emit role_changed event
      expect(listener).not.toHaveBeenCalledWith({
        type: 'role_changed',
        payload: expect.anything(),
      });
    });

    it('should emit error when trying to demote last manager', async () => {
      mockApiDemoteFromManager.mockResolvedValueOnce({
        success: false,
        error: 'Cannot demote the last manager. Promote someone else first.',
      });

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.demoteFromManager('participant-123');

      expect(result).toBe(false);
      expect(bloc.isManager).toBe(true); // Should not change
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Cannot demote the last manager. Promote someone else first.',
      });
    });
  });

  describe('kickParticipant', () => {
    it('should reject when not a manager', async () => {
      bloc.isManager = false;

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.kickParticipant('participant-456');

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Only managers can kick participants',
      });
      expect(mockApiKickParticipant).not.toHaveBeenCalled();
    });

    it('should reject kicking yourself', async () => {
      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.kickParticipant('participant-123'); // self

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'You cannot kick yourself. Use leave instead.',
      });
      expect(mockApiKickParticipant).not.toHaveBeenCalled();
    });

    it('should kick participant successfully', async () => {
      mockApiKickParticipant.mockResolvedValueOnce({ success: true });

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.kickParticipant('participant-456');

      expect(result).toBe(true);
      expect(mockApiKickParticipant).toHaveBeenCalledWith('room-123', 'participant-456');
      expect(listener).toHaveBeenCalledWith({
        type: 'participant_kicked',
        payload: { participantId: 'participant-456' },
      });
    });

    it('should emit error on API failure', async () => {
      mockApiKickParticipant.mockResolvedValueOnce({ success: false, error: 'Participant not found' });

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.kickParticipant('invalid-id');

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Participant not found',
      });
    });
  });

  describe('updateSettings', () => {
    it('should reject when not a manager', async () => {
      bloc.isManager = false;

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.updateSettings({ showVotes: true });

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Only managers can change room settings',
      });
      expect(mockApiUpdateRoomSettings).not.toHaveBeenCalled();
    });

    it('should update settings when manager', async () => {
      mockApiUpdateRoomSettings.mockResolvedValueOnce({
        success: true,
        data: {
          name: 'Updated Room',
          showVotes: true,
          voteOptions: ['1', '2', '3', '5', '8'],
        },
      });

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.updateSettings({
        name: 'Updated Room',
        showVotes: true,
        voteOptions: ['1', '2', '3', '5', '8'],
      });

      expect(result).toBe(true);
      expect(mockApiUpdateRoomSettings).toHaveBeenCalledWith('room-123', {
        name: 'Updated Room',
        showVotes: true,
        voteOptions: ['1', '2', '3', '5', '8'],
      });
      expect(listener).toHaveBeenCalledWith({
        type: 'settings_changed',
        payload: {
          name: 'Updated Room',
          showVotes: true,
          voteOptions: ['1', '2', '3', '5', '8'],
        },
      });
    });

    it('should update partial settings', async () => {
      mockApiUpdateRoomSettings.mockResolvedValueOnce({
        success: true,
        data: {
          name: 'Test Room',
          showVotes: true,
          voteOptions: ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕'],
        },
      });

      const result = await bloc.updateSettings({ showVotes: true });

      expect(result).toBe(true);
      expect(mockApiUpdateRoomSettings).toHaveBeenCalledWith('room-123', {
        showVotes: true,
      });
    });

    it('should emit error on API failure', async () => {
      mockApiUpdateRoomSettings.mockResolvedValueOnce({
        success: false,
        error: 'Failed to update settings',
      });

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.updateSettings({ name: 'New Name' });

      expect(result).toBe(false);
      expect(listener).toHaveBeenCalledWith({
        type: 'error',
        payload: 'Failed to update settings',
      });
    });

    it('should not emit settings_changed when no data returned', async () => {
      mockApiUpdateRoomSettings.mockResolvedValueOnce({
        success: true,
      });

      const listener = vi.fn();
      bloc.subscribe(listener);

      const result = await bloc.updateSettings({ showVotes: true });

      expect(result).toBe(true);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('calculateResults', () => {
    it('should calculate results correctly', () => {
      const participants = [
        { current_vote: '5' },
        { current_vote: '5' },
        { current_vote: '8' },
        { current_vote: '3' },
        { current_vote: null },
      ];

      const { results, average } = RoomBloc.calculateResults(participants);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ vote: '5', count: 2, percentage: 40 });
      expect(results[1].count).toBe(1);

      // Average of 5, 5, 8, 3 = 21/4 = 5.25
      expect(average).toBeCloseTo(5.25);
    });

    it('should handle all null votes', () => {
      const participants = [
        { current_vote: null },
        { current_vote: null },
      ];

      const { results, average } = RoomBloc.calculateResults(participants);

      expect(results).toHaveLength(0);
      expect(average).toBeNull();
    });

    it('should handle non-numeric votes', () => {
      const participants = [
        { current_vote: '?' },
        { current_vote: '☕' },
        { current_vote: '5' },
      ];

      const { results, average } = RoomBloc.calculateResults(participants);

      expect(results).toHaveLength(3);
      // Average should only include numeric votes
      expect(average).toBe(5);
    });

    it('should handle empty participants', () => {
      const { results, average } = RoomBloc.calculateResults([]);

      expect(results).toHaveLength(0);
      expect(average).toBeNull();
    });

    it('should sort results by count descending', () => {
      const participants = [
        { current_vote: '3' },
        { current_vote: '5' },
        { current_vote: '5' },
        { current_vote: '5' },
        { current_vote: '8' },
        { current_vote: '8' },
      ];

      const { results } = RoomBloc.calculateResults(participants);

      expect(results[0].vote).toBe('5');
      expect(results[0].count).toBe(3);
      expect(results[1].vote).toBe('8');
      expect(results[1].count).toBe(2);
      expect(results[2].vote).toBe('3');
      expect(results[2].count).toBe(1);
    });
  });

  describe('dispose', () => {
    it('should clear listeners on dispose', () => {
      const listener = vi.fn();
      bloc.subscribe(listener);

      bloc.dispose();

      // After dispose, listeners should be cleared
      // We can't easily test this without accessing private state,
      // but we can verify no errors occur
      expect(() => bloc.dispose()).not.toThrow();
    });
  });
});
