// Room API functions - handles all server communication

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function submitVote(roomId: string, vote: string): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('vote', vote);

  try {
    const response = await fetch(`/api/rooms/${roomId}/vote`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to submit vote' };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to submit vote:', err);
    return { success: false, error: 'Network error' };
  }
}

export async function startVoting(roomId: string, topic: string): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('topic', topic);

  try {
    const response = await fetch(`/api/rooms/${roomId}/start-voting`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to start voting' };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to start voting:', err);
    return { success: false, error: 'Network error' };
  }
}

export async function revealVotes(roomId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/rooms/${roomId}/reveal-votes`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to reveal votes' };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to reveal votes:', err);
    return { success: false, error: 'Network error' };
  }
}

export async function resetVotes(roomId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/rooms/${roomId}/reset-votes`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to reset votes' };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to reset votes:', err);
    return { success: false, error: 'Network error' };
  }
}

export async function joinRoom(roomId: string, name: string): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('name', name);

  try {
    const response = await fetch(`/api/rooms/${roomId}/join`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to join room' };
    }

    return { success: true, data: result };
  } catch (err) {
    console.error('Failed to join room:', err);
    return { success: false, error: 'Network error' };
  }
}

export async function leaveRoom(roomId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(`/api/rooms/${roomId}/leave`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to leave room' };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to leave room:', err);
    return { success: false, error: 'Network error' };
  }
}

export async function updateName(roomId: string, name: string): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('name', name);

  try {
    const response = await fetch(`/api/rooms/${roomId}/update-name`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to update name' };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to update name:', err);
    return { success: false, error: 'Network error' };
  }
}

export async function toggleShowVotes(roomId: string): Promise<ApiResponse<{ showVotes: boolean }>> {
  try {
    const response = await fetch(`/api/rooms/${roomId}/toggle-show-votes`, {
      method: 'POST',
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to toggle show votes' };
    }

    return { success: true, data: { showVotes: result.showVotes } };
  } catch (err) {
    console.error('Failed to toggle show votes:', err);
    return { success: false, error: 'Network error' };
  }
}
