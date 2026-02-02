import { describe, it, expect } from 'vitest';
import {
  canManageRole,
  canManageTeam,
  canInviteMembers,
  canDeleteTeam,
  getRoleLabel,
  getRoleColor,
  ROLE_HIERARCHY,
  type TeamRole,
} from './types';

describe('Team Types', () => {
  describe('ROLE_HIERARCHY', () => {
    it('should have owner as highest priority', () => {
      expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin);
      expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.member);
    });

    it('should have admin higher than member', () => {
      expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.member);
    });

    it('should have correct values', () => {
      expect(ROLE_HIERARCHY.owner).toBe(3);
      expect(ROLE_HIERARCHY.admin).toBe(2);
      expect(ROLE_HIERARCHY.member).toBe(1);
    });
  });

  describe('canManageRole', () => {
    it('owner can manage admin', () => {
      expect(canManageRole('owner', 'admin')).toBe(true);
    });

    it('owner can manage member', () => {
      expect(canManageRole('owner', 'member')).toBe(true);
    });

    it('owner cannot manage owner', () => {
      expect(canManageRole('owner', 'owner')).toBe(false);
    });

    it('admin can manage member', () => {
      expect(canManageRole('admin', 'member')).toBe(true);
    });

    it('admin cannot manage owner', () => {
      expect(canManageRole('admin', 'owner')).toBe(false);
    });

    it('admin cannot manage admin', () => {
      expect(canManageRole('admin', 'admin')).toBe(false);
    });

    it('member cannot manage anyone', () => {
      expect(canManageRole('member', 'owner')).toBe(false);
      expect(canManageRole('member', 'admin')).toBe(false);
      expect(canManageRole('member', 'member')).toBe(false);
    });
  });

  describe('canManageTeam', () => {
    it('owner can manage team', () => {
      expect(canManageTeam('owner')).toBe(true);
    });

    it('admin can manage team', () => {
      expect(canManageTeam('admin')).toBe(true);
    });

    it('member cannot manage team', () => {
      expect(canManageTeam('member')).toBe(false);
    });
  });

  describe('canInviteMembers', () => {
    it('owner can invite members', () => {
      expect(canInviteMembers('owner')).toBe(true);
    });

    it('admin can invite members', () => {
      expect(canInviteMembers('admin')).toBe(true);
    });

    it('member cannot invite members', () => {
      expect(canInviteMembers('member')).toBe(false);
    });
  });

  describe('canDeleteTeam', () => {
    it('owner can delete team', () => {
      expect(canDeleteTeam('owner')).toBe(true);
    });

    it('admin cannot delete team', () => {
      expect(canDeleteTeam('admin')).toBe(false);
    });

    it('member cannot delete team', () => {
      expect(canDeleteTeam('member')).toBe(false);
    });
  });

  describe('getRoleLabel', () => {
    it('returns correct label for owner', () => {
      expect(getRoleLabel('owner')).toBe('Owner');
    });

    it('returns correct label for admin', () => {
      expect(getRoleLabel('admin')).toBe('Admin');
    });

    it('returns correct label for member', () => {
      expect(getRoleLabel('member')).toBe('Member');
    });
  });

  describe('getRoleColor', () => {
    it('returns warning colors for owner', () => {
      const color = getRoleColor('owner');
      expect(color).toContain('warning');
    });

    it('returns brand colors for admin', () => {
      const color = getRoleColor('admin');
      expect(color).toContain('brand');
    });

    it('returns muted colors for member', () => {
      const color = getRoleColor('member');
      expect(color).toContain('muted');
    });

    it('returns valid CSS class strings', () => {
      const roles: TeamRole[] = ['owner', 'admin', 'member'];
      roles.forEach((role) => {
        const color = getRoleColor(role);
        expect(color).toMatch(/^[a-z0-9\s\-\/:.]+$/i);
      });
    });
  });
});
