/**
 * useOrganization Hook
 * TMC Studio - Club (organization) management for the Settings > Club panel.
 *
 * Loads the current user's organization (if any), its members and pending
 * invitations, and exposes CRUD/invite actions. Gated by the `team` plan's
 * `canInviteMembers` entitlement (see lib/entitlements.ts).
 */

import { useCallback, useEffect, useState } from 'react';
import { logger } from '../lib/logger';
import { useAuthStore } from '../store/useAuthStore';
import { useEntitlements } from './useEntitlements';
import {
  getMyOrganization,
  getMembers,
  getInvitations,
  getSeatUsage,
  createOrganization as createOrganizationApi,
  inviteMember as inviteMemberApi,
  revokeInvitation as revokeInvitationApi,
  removeMember as removeMemberApi,
  transferOwnership as transferOwnershipApi,
  deleteOrganization as deleteOrganizationApi,
  type Organization,
  type OrgRole,
} from '../lib/organizations';
import type {
  OrganizationPanelProps,
  OrganizationMemberView,
  InvitationView,
} from '@tmc/ui';

export function useOrganization(): OrganizationPanelProps {
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { entitlements } = useEntitlements();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<OrgRole | null>(null);
  const [members, setMembers] = useState<OrganizationMemberView[]>([]);
  const [invitations, setInvitations] = useState<InvitationView[]>([]);
  const [seatUsage, setSeatUsage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setOrganization(null);
      setRole(null);
      setMembers([]);
      setInvitations([]);
      setSeatUsage(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyOrganization();
      if (!result) {
        setOrganization(null);
        setRole(null);
        setMembers([]);
        setInvitations([]);
        setSeatUsage(0);
        return;
      }

      setOrganization(result.organization);
      setRole(result.role);

      const [memberRows, invitationRows, usage] = await Promise.all([
        getMembers(result.organization.id),
        result.role === 'owner'
          ? getInvitations(result.organization.id)
          : Promise.resolve([]),
        getSeatUsage(result.organization.id),
      ]);

      setMembers(
        memberRows.map((m) => ({
          id: m.id,
          userId: m.user_id,
          role: m.role,
          email: m.email,
          fullName: m.full_name,
          isSelf: m.user_id === authUser?.id,
        }))
      );
      setInvitations(
        invitationRows.map((inv) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          token: inv.token,
          status: inv.status,
        }))
      );
      setSeatUsage(usage);
    } catch (err) {
      logger.error('Failed to load organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to load club');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authUser?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreateOrganization = useCallback(async (name: string) => {
    await createOrganizationApi(name);
    await refresh();
  }, [refresh]);

  const handleInvite = useCallback(async (email: string) => {
    if (!organization) throw new Error('No organization');
    await inviteMemberApi(organization.id, email);
    await refresh();
  }, [organization, refresh]);

  const handleRevokeInvitation = useCallback(async (invitationId: string) => {
    await revokeInvitationApi(invitationId);
    await refresh();
  }, [refresh]);

  const handleRemoveMember = useCallback(async (memberId: string) => {
    await removeMemberApi(memberId);
    await refresh();
  }, [refresh]);

  const handleTransferOwnership = useCallback(async (newOwnerUserId: string) => {
    await transferOwnershipApi(organization!.id, newOwnerUserId);
    await refresh();
  }, [organization, refresh]);

  const handleDeleteOrganization = useCallback(async () => {
    if (!organization) return;
    await deleteOrganizationApi(organization.id);
    await refresh();
  }, [organization, refresh]);

  const getInviteLink = useCallback((token: string) => {
    if (typeof window === 'undefined') return `/invite?token=${token}`;
    return `${window.location.origin}/invite?token=${token}`;
  }, []);

  return {
    isEnabled: entitlements.canInviteMembers,
    organization: organization ? { id: organization.id, name: organization.name } : null,
    role,
    members,
    invitations,
    maxSeats: entitlements.maxSeats,
    seatUsage,
    isLoading,
    error,
    onCreateOrganization: handleCreateOrganization,
    onInvite: handleInvite,
    onRevokeInvitation: handleRevokeInvitation,
    onRemoveMember: handleRemoveMember,
    onTransferOwnership: handleTransferOwnership,
    onDeleteOrganization: handleDeleteOrganization,
    getInviteLink,
  };
}
