// Team API client functions
// Handles all client-side API calls for team management

import type {
  Team,
  TeamWithMembership,
  TeamWithDetails,
  TeamMember,
  TeamInvitation,
  TeamRole,
} from './types';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// TEAMS
// ============================================

export async function getTeams(): Promise<ApiResponse<TeamWithMembership[]>> {
  try {
    const response = await fetch('/api/teams');
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result.teams };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function createTeam(data: {
  name: string;
  slug: string;
  avatar_url?: string;
}): Promise<{ id: string; slug: string }> {
  const response = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create team');
  }
  return result;
}

export async function getTeam(slug: string): Promise<ApiResponse<TeamWithDetails>> {
  try {
    const response = await fetch(`/api/teams/${slug}`);
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function updateTeam(
  slug: string,
  data: { name?: string; avatar_url?: string | null }
): Promise<Team> {
  const response = await fetch(`/api/teams/${slug}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to update team');
  }
  return result;
}

export async function deleteTeam(slug: string): Promise<void> {
  const response = await fetch(`/api/teams/${slug}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to delete team');
  }
}

// ============================================
// MEMBERS
// ============================================

export async function getMembers(slug: string): Promise<ApiResponse<TeamMember[]>> {
  try {
    const response = await fetch(`/api/teams/${slug}/members`);
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result.members };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function updateMemberRole(
  slug: string,
  userId: string,
  role: TeamRole
): Promise<void> {
  const response = await fetch(`/api/teams/${slug}/members/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to update member role');
  }
}

export async function removeMember(slug: string, userId: string): Promise<void> {
  const response = await fetch(`/api/teams/${slug}/members/${userId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to remove member');
  }
}

export async function leaveTeam(slug: string): Promise<void> {
  const response = await fetch(`/api/teams/${slug}/leave`, {
    method: 'POST',
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to leave team');
  }
}

// ============================================
// INVITATIONS
// ============================================

export async function getInvitations(slug: string): Promise<ApiResponse<TeamInvitation[]>> {
  try {
    const response = await fetch(`/api/teams/${slug}/invitations`);
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result.invitations };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function createEmailInvitation(
  slug: string,
  email: string,
  role: TeamRole
): Promise<ApiResponse<TeamInvitation>> {
  try {
    const response = await fetch(`/api/teams/${slug}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email', email, role }),
    });
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function createLinkInvitation(
  slug: string,
  role: TeamRole,
  expiresInDays?: number,
  maxUses?: number
): Promise<ApiResponse<{ token: string; url: string }>> {
  try {
    const response = await fetch(`/api/teams/${slug}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'link',
        role,
        expires_in_days: expiresInDays,
        max_uses: maxUses,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

export async function revokeInvitation(slug: string, invitationId: string): Promise<void> {
  const response = await fetch(`/api/teams/${slug}/invitations/${invitationId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to revoke invitation');
  }
}

export async function resendInvitation(slug: string, invitationId: string): Promise<void> {
  const response = await fetch(`/api/teams/${slug}/invitations/${invitationId}/resend`, {
    method: 'POST',
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || 'Failed to resend invitation');
  }
}

// Unified invitation creation function
export async function createInvitation(
  slug: string,
  options: {
    type: 'email' | 'link';
    email?: string;
    role: 'admin' | 'member';
    expiresInDays?: number;
    maxUses?: number;
  }
): Promise<{ token?: string; id?: string }> {
  const response = await fetch(`/api/teams/${slug}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: options.type,
      email: options.email,
      role: options.role,
      expires_in_days: options.expiresInDays,
      max_uses: options.maxUses,
    }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create invitation');
  }
  return result;
}

export async function acceptInvitation(
  token: string
): Promise<ApiResponse<{ team_slug: string }>> {
  try {
    const response = await fetch(`/api/invitations/${token}`, {
      method: 'POST',
    });
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

// ============================================
// TEAM ROOMS
// ============================================

export async function createTeamRoom(
  slug: string,
  name: string
): Promise<{ id: string }> {
  const response = await fetch(`/api/teams/${slug}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Failed to create room');
  }
  return result;
}

// ============================================
// UTILITIES
// ============================================

/**
 * Validate team slug format
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

/**
 * Generate a slug from a team name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}
