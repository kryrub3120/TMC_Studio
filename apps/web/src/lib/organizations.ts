/**
 * Organizations (Clubs) - CRUD + Invitations
 * TMC Studio - Cloud backend integration
 *
 * Lets a "team" plan user create a club, invite coaches/members via
 * email-token invitations, and manage roles. See
 * supabase/migrations/20260615000000_add_organizations.sql for schema + RLS.
 */

import { logger } from './logger';
import { supabase } from './supabase';
import { isDevCloudActive } from './devCloud';
import * as devCloud from './devCloud';

// =====================================================
// TYPES
// =====================================================

export type OrgRole = 'owner' | 'member';
/** Invitations always create plain members - only owners send invites. */
export type InvitationRole = 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export type Organization = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgRole;
  invited_by: string | null;
  created_at: string;
  // Joined from profiles, when available
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
};

export type Invitation = {
  id: string;
  organization_id: string;
  email: string;
  role: InvitationRole;
  token: string;
  status: InvitationStatus;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

// =====================================================
// ORGANIZATION
// =====================================================

/**
 * Returns the organization the current user belongs to (owner, admin,
 * coach, or member), or null if they aren't part of one.
 * Currently each user belongs to at most one organization.
 */
export async function getMyOrganization(): Promise<{ organization: Organization; role: OrgRole } | null> {
  if (isDevCloudActive()) return devCloud.getMyOrganization(); // DEV-ONLY
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('role, organizations(*)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberError) {
    logger.error('Error fetching organization membership:', memberError);
    return null;
  }

  if (!membership || !membership.organizations) return null;

  return {
    organization: membership.organizations as unknown as Organization,
    role: membership.role as OrgRole,
  };
}

/** Create a new organization (club). The creator becomes its 'owner'. */
export async function createOrganization(name: string): Promise<Organization> {
  if (isDevCloudActive()) return devCloud.createOrganization(name); // DEV-ONLY
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('organizations')
    .insert({ name, owner_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Organization;
}

/** Rename an organization. Requires owner/admin role (enforced by RLS). */
export async function updateOrganization(organizationId: string, updates: { name: string }): Promise<void> {
  if (isDevCloudActive()) return devCloud.updateOrganization(updates); // DEV-ONLY
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', organizationId);

  if (error) throw error;
}

/**
 * Permanently delete an organization (and cascade its members and
 * invitations). Only the current owner can do this (enforced by RLS
 * `org_delete_owner`). Intended for the case where the owner is the club's
 * sole member and wants to "leave" - deleting the club is the only
 * meaningful equivalent, since the owner role can't simply be removed.
 */
export async function deleteOrganization(organizationId: string): Promise<void> {
  if (isDevCloudActive()) return devCloud.deleteMyOrganization(); // DEV-ONLY
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId);

  if (error) throw error;
}

// =====================================================
// MEMBERS
// =====================================================

/** List members of an organization, including basic profile info. */
export async function getMembers(organizationId: string): Promise<OrganizationMember[]> {
  if (isDevCloudActive()) return devCloud.getOrgMembers(); // DEV-ONLY
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('organization_members')
    .select('*, profiles(email, full_name, avatar_url)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Error fetching organization members:', error);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profile = (row.profiles ?? {}) as { email?: string; full_name?: string | null; avatar_url?: string | null };
    return {
      id: row.id as string,
      organization_id: row.organization_id as string,
      user_id: row.user_id as string,
      role: row.role as OrgRole,
      invited_by: (row.invited_by as string | null) ?? null,
      created_at: row.created_at as string,
      email: profile.email,
      full_name: profile.full_name ?? null,
      avatar_url: profile.avatar_url ?? null,
    };
  });
}

/**
 * Remove a member from the organization.
 * Admins can remove anyone (except owners); members can remove themselves
 * (leave the club). Enforced by RLS.
 */
export async function removeMember(memberId: string): Promise<void> {
  if (isDevCloudActive()) return devCloud.removeOrgMember(memberId); // DEV-ONLY
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}

/**
 * Transfer ownership of the organization to another existing member.
 * The current owner becomes an 'admin'. Atomic via the `transfer_ownership`
 * SECURITY DEFINER RPC. Only callable by the current owner (enforced
 * server-side).
 */
export async function transferOwnership(organizationId: string, newOwnerUserId: string): Promise<void> {
  if (isDevCloudActive()) return devCloud.transferOrgOwnership(newOwnerUserId); // DEV-ONLY
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase.rpc('transfer_ownership', {
    p_org_id: organizationId,
    p_new_owner_user_id: newOwnerUserId,
  });

  if (error) throw error;
}

// =====================================================
// INVITATIONS
// =====================================================

/** List invitations for an organization (admins/owners only, via RLS). */
export async function getInvitations(organizationId: string): Promise<Invitation[]> {
  if (isDevCloudActive()) return devCloud.getOrgInvitations(); // DEV-ONLY
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching invitations:', error);
    return [];
  }

  return (data ?? []) as Invitation[];
}

/**
 * Create an invitation for an email address. Returns the invitation,
 * including its token so the UI can build a shareable accept link
 * (`/invite?token=...`). No email is sent by this function — the caller
 * is responsible for sharing the link (copy-to-clipboard, etc.).
 */
export async function inviteMember(
  organizationId: string,
  email: string
): Promise<Invitation> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Email is required');

  if (isDevCloudActive()) return devCloud.createOrgInvitation(organizationId, normalizedEmail); // DEV-ONLY
  if (!supabase) throw new Error('Supabase not configured');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      organization_id: organizationId,
      email: normalizedEmail,
      role: 'member',
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    // Unique constraint on (organization_id, email) WHERE status = 'pending'
    if (error.code === '23505') {
      throw new Error('There is already a pending invitation for this email');
    }
    throw error;
  }

  return data as Invitation;
}

/** Revoke a pending invitation. Requires owner/admin role (enforced by RLS). */
export async function revokeInvitation(invitationId: string): Promise<void> {
  if (isDevCloudActive()) return devCloud.revokeOrgInvitation(invitationId); // DEV-ONLY
  if (!supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);

  if (error) throw error;
}

/**
 * Accept a pending invitation for the currently signed-in user.
 * The user's account email must match the invitation's email.
 * Calls the `accept_invitation` SECURITY DEFINER RPC, which adds the user
 * to `organization_members` and marks the invitation as accepted.
 */
export async function acceptInvitation(token: string): Promise<{ organizationId: string; role: OrgRole }> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error('Invitation could not be accepted');

  return { organizationId: row.organization_id as string, role: row.role as OrgRole };
}

/**
 * Look up a pending invitation by token without accepting it, for the
 * `/invite?token=...` landing page (e.g. to show "You've been invited to
 * join <club> as <role>" before the user signs in).
 *
 * Uses the `get_invitation_preview` RPC (callable by anonymous visitors) so
 * the invite landing page works even before the user signs in.
 */
export type InvitationPreview = {
  organization_name: string;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  expires_at: string;
};

export async function getInvitationByToken(token: string): Promise<InvitationPreview | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .rpc('get_invitation_preview', { p_token: token })
    .maybeSingle();

  if (error) {
    logger.error('Error fetching invitation:', error);
    return null;
  }

  if (!data) return null;

  return data as InvitationPreview;
}

// =====================================================
// SEAT USAGE
// =====================================================

/** Number of members + pending invitations, for plan seat-limit checks. */
export async function getSeatUsage(organizationId: string): Promise<number> {
  if (isDevCloudActive()) return devCloud.getOrgSeatUsage(); // DEV-ONLY
  if (!supabase) return 0;

  const { data, error } = await supabase.rpc('get_org_seat_usage', { p_org_id: organizationId });
  if (error) {
    logger.error('Error fetching seat usage:', error);
    return 0;
  }

  return (data as number) ?? 0;
}
