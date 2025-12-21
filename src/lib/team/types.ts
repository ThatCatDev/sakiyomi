// Team-related types

export type TeamRole = 'owner' | 'admin' | 'member';
export type InvitationType = 'email' | 'link';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Team {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
  // Joined user data (when fetched with select)
  user?: {
    id: string;
    email: string;
  };
}

export interface TeamMemberWithUser extends TeamMember {
  user?: {
    id: string;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  invited_by: string | null;
  email: string | null;
  token: string | null;
  invitation_type: InvitationType;
  role: TeamRole;
  status: InvitationStatus;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  created_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  // Joined data
  inviter?: {
    email: string;
  };
}

export interface TeamLimits {
  id: string;
  team_id: string;
  max_members: number | null;
  max_active_rooms: number | null;
  plan_name: string;
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with joined data
export interface TeamWithMembership extends Team {
  role: TeamRole;
  member_count?: number;
}

export interface TeamWithDetails extends Team {
  members: TeamMember[];
  limits: TeamLimits | null;
  room_count: number;
  current_user_role: TeamRole;
}

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

/**
 * Check if a user with userRole can manage (update/remove) a target with targetRole
 * Only higher roles can manage lower roles
 */
export function canManageRole(userRole: TeamRole, targetRole: TeamRole): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Check if a role has team management permissions (owner or admin)
 */
export function canManageTeam(role: TeamRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Check if a role can invite new members
 */
export function canInviteMembers(role: TeamRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Check if a role can delete the team
 */
export function canDeleteTeam(role: TeamRole): boolean {
  return role === 'owner';
}

/**
 * Get display label for a role
 */
export function getRoleLabel(role: TeamRole): string {
  const labels: Record<TeamRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  };
  return labels[role];
}

/**
 * Get color classes for a role badge
 */
export function getRoleColor(role: TeamRole): string {
  const colors: Record<TeamRole, string> = {
    owner: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    admin: 'bg-brand-light text-brand',
    member: 'bg-surface-tertiary text-content-muted',
  };
  return colors[role];
}
