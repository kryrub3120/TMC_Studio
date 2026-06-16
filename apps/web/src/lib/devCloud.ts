/**
 * Dev Cloud Mock - localStorage-backed fake "cloud" for projects & folders
 * TMC Studio - DEV-ONLY testing aid
 *
 * Purpose:
 * When a "Test login" (devLogin) session is active, there is no real
 * Supabase user/session, so calling the real projects/folders API would
 * just fail RLS checks silently (empty lists, no folders, etc).
 *
 * This module provides a drop-in localStorage-backed implementation of the
 * same project/folder CRUD functions exported by `./supabase`, scoped per
 * mock user (so "Test: Free", "Test: Solo Premium", "Test: Team Premium"
 * each get their own isolated set of projects/folders).
 *
 * IMPORTANT (test semantics): switching tiers via the dev buttons logs in as a
 * DIFFERENT mock user, each with its own isolated store. This is great for
 * testing per-plan UX from zero, but it does NOT simulate upgrading an existing
 * account — projects do not carry over between tiers. Also note that
 * `clearDevCloudData()` only clears the active tier; use `clearAllDevCloudData()`
 * to reset every tier at once (see useAuthStore.devClearAllTiers).
 *
 * Removal: this whole file + the `isDevCloudActive()` guards added to the
 * matching functions in `./supabase.ts` can be deleted together once dev
 * test-login is no longer needed. Nothing here touches real Supabase.
 */

import type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  ProjectFolder,
  ProjectFolderInsert,
  ProjectFolderUpdate,
} from './supabase';
import type {
  Organization,
  OrganizationMember,
  Invitation,
  OrgRole,
} from './organizations';

const ACTIVE_USER_KEY = 'tmc-studio-dev-cloud-user';

/** Mark a dev mock user as "logged in" - activates the mock cloud. */
export function setDevCloudUser(userId: string | null): void {
  if (typeof window === 'undefined') return;
  if (userId) {
    window.localStorage.setItem(ACTIVE_USER_KEY, userId);
  } else {
    window.localStorage.removeItem(ACTIVE_USER_KEY);
  }
}

/** Currently active dev mock user id, or null if none. */
export function getDevCloudUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACTIVE_USER_KEY);
}

/** True if a dev mock "cloud" session is active. */
export function isDevCloudActive(): boolean {
  return getDevCloudUserId() !== null;
}

/** Wipe all projects & folders for the currently active dev mock user. */
export function clearDevCloudData(): void {
  const userId = getDevCloudUserId();
  if (!userId || typeof window === 'undefined') return;
  window.localStorage.removeItem(storageKey('projects', userId));
  window.localStorage.removeItem(storageKey('folders', userId));
  window.localStorage.removeItem(orgStorageKey('org', userId));
  window.localStorage.removeItem(orgStorageKey('members', userId));
  window.localStorage.removeItem(orgStorageKey('invitations', userId));
}

/**
 * Wipe projects & folders for EVERY dev mock tier, not just the active one.
 *
 * NOTE: each test tier (`dev-free-user`, `dev-pro-user`, `dev-team-user`) has
 * its own isolated, per-user storage keys. `clearDevCloudData()` only clears
 * the currently active tier, so data for other tiers can accumulate across
 * long test sessions. Use this to reset all of them at once.
 */
export function clearAllDevCloudData(): void {
  if (typeof window === 'undefined') return;
  const tiers = ['dev-free-user', 'dev-pro-user', 'dev-team-user', 'dev-user'];
  for (const userId of tiers) {
    window.localStorage.removeItem(storageKey('projects', userId));
    window.localStorage.removeItem(storageKey('folders', userId));
    window.localStorage.removeItem(orgStorageKey('org', userId));
    window.localStorage.removeItem(orgStorageKey('members', userId));
    window.localStorage.removeItem(orgStorageKey('invitations', userId));
  }
}

// ===== storage helpers =====

function storageKey(kind: 'projects' | 'folders', userId: string): string {
  return `tmc-studio-dev-cloud-${kind}-${userId}`;
}

function readList<T>(kind: 'projects' | 'folders'): T[] {
  const userId = getDevCloudUserId();
  if (!userId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(kind, userId));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(kind: 'projects' | 'folders', list: T[]): void {
  const userId = getDevCloudUserId();
  if (!userId || typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(kind, userId), JSON.stringify(list));
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// =====================================================
// PROJECTS
// =====================================================

export function getProjects(): Project[] {
  return readList<Project>('projects').slice().sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function getProject(id: string): Project | null {
  return readList<Project>('projects').find((p) => p.id === id) ?? null;
}

export function createProject(project: ProjectInsert): Project {
  const userId = getDevCloudUserId() ?? 'dev-user';
  const list = readList<Project>('projects');

  const created: Project = {
    id: uuid(),
    user_id: userId,
    name: project.name ?? 'Untitled Board',
    description: project.description ?? null,
    document: project.document,
    thumbnail_url: project.thumbnail_url ?? null,
    is_public: project.is_public ?? false,
    is_template: false,
    version: 1,
    created_at: nowIso(),
    updated_at: nowIso(),
    folder_id: null,
    tags: [],
    is_favorite: false,
    is_pinned: false,
    position: list.length,
  };

  writeList('projects', [...list, created]);
  return created;
}

export function updateProject(id: string, updates: ProjectUpdate): Project | null {
  const list = readList<Project>('projects');
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const updated: Project = {
    ...list[idx],
    ...updates,
    updated_at: nowIso(),
  };
  list[idx] = updated;
  writeList('projects', list);
  return updated;
}

export function deleteProject(id: string): boolean {
  const list = readList<Project>('projects');
  const next = list.filter((p) => p.id !== id);
  writeList('projects', next);
  return next.length !== list.length;
}

export function moveProjectToFolder(projectId: string, folderId: string | null): boolean {
  return updateProject(projectId, { folder_id: folderId }) !== null;
}

export function toggleProjectFavorite(projectId: string, isFavorite: boolean): boolean {
  const list = readList<Project>('projects');
  const idx = list.findIndex((p) => p.id === projectId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], is_favorite: isFavorite, updated_at: nowIso() };
  writeList('projects', list);
  return true;
}

export function updateProjectTags(projectId: string, tags: string[]): boolean {
  const list = readList<Project>('projects');
  const idx = list.findIndex((p) => p.id === projectId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], tags, updated_at: nowIso() };
  writeList('projects', list);
  return true;
}

export function toggleProjectPinned(projectId: string, isPinned: boolean): boolean {
  const list = readList<Project>('projects');
  const idx = list.findIndex((p) => p.id === projectId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], is_pinned: isPinned, updated_at: nowIso() };
  writeList('projects', list);
  return true;
}

export function renameProject(projectId: string, name: string): boolean {
  const list = readList<Project>('projects');
  const idx = list.findIndex((p) => p.id === projectId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], name, updated_at: nowIso() };
  writeList('projects', list);
  return true;
}

// =====================================================
// STORAGE (thumbnails)
// =====================================================

/**
 * DEV-ONLY mock for uploadThumbnail: converts the blob to a data URL and
 * returns it. The caller (generateThumbnail) then persists it via
 * updateProject, so dev cards get a real preview without any storage backend.
 */
export async function uploadThumbnail(_projectId: string, file: Blob): Promise<string | null> {
  if (typeof window === 'undefined' || typeof FileReader === 'undefined') return null;
  try {
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  } catch {
    return null;
  }
}

// =====================================================
// FOLDERS
// =====================================================

export function getFolders(): ProjectFolder[] {
  return readList<ProjectFolder>('folders').slice().sort((a, b) => a.position - b.position);
}

export function getFolder(id: string): ProjectFolder | null {
  return readList<ProjectFolder>('folders').find((f) => f.id === id) ?? null;
}

export function createFolder(folder: ProjectFolderInsert): ProjectFolder {
  const userId = getDevCloudUserId() ?? 'dev-user';
  const list = readList<ProjectFolder>('folders');

  const created: ProjectFolder = {
    id: uuid(),
    user_id: userId,
    name: folder.name,
    color: folder.color ?? '#3b82f6',
    icon: folder.icon ?? '📁',
    description: folder.description ?? null,
    parent_id: folder.parent_id ?? null,
    is_pinned: false,
    position: folder.position ?? list.length,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  writeList('folders', [...list, created]);
  return created;
}

export function updateFolder(id: string, updates: ProjectFolderUpdate): ProjectFolder | null {
  const list = readList<ProjectFolder>('folders');
  const idx = list.findIndex((f) => f.id === id);
  if (idx === -1) return null;

  const updated: ProjectFolder = {
    ...list[idx],
    ...updates,
    updated_at: nowIso(),
  };
  list[idx] = updated;
  writeList('folders', list);
  return updated;
}

export function deleteFolder(id: string): boolean {
  const list = readList<ProjectFolder>('folders');
  const next = list.filter((f) => f.id !== id);
  writeList('folders', next);

  // Un-file any projects that were in this folder (mirrors ON DELETE SET NULL)
  const projects = readList<Project>('projects');
  writeList(
    'projects',
    projects.map((p) => (p.folder_id === id ? { ...p, folder_id: null } : p))
  );

  return next.length !== list.length;
}

export function toggleFolderPinned(folderId: string, isPinned: boolean): boolean {
  const list = readList<ProjectFolder>('folders');
  const idx = list.findIndex((f) => f.id === folderId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], is_pinned: isPinned, updated_at: nowIso() };
  writeList('folders', list);
  return true;
}

export function renameFolder(folderId: string, name: string): boolean {
  const list = readList<ProjectFolder>('folders');
  const idx = list.findIndex((f) => f.id === folderId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], name, updated_at: nowIso() };
  writeList('folders', list);
  return true;
}

export function updateFolderPosition(folderId: string, parentId: string | null, position: number): boolean {
  const list = readList<ProjectFolder>('folders');
  const idx = list.findIndex((f) => f.id === folderId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], parent_id: parentId, position, updated_at: nowIso() };
  writeList('folders', list);
  return true;
}

// =====================================================
// ORGANIZATIONS (Clubs) - DEV-ONLY mock
// =====================================================
//
// Mirrors organizations.ts but stores everything in localStorage, scoped to
// the active dev mock user (one club per tier). Since a dev session only
// ever represents a single user, "members" will only ever contain that one
// user — good enough to exercise the create/rename/invite/role/leave UI,
// but invitations can't actually be "accepted" by a second mock account.

function orgStorageKey(kind: 'org' | 'members' | 'invitations', userId: string): string {
  return `tmc-studio-dev-cloud-${kind}-${userId}`;
}

function readOrgValue<T>(kind: 'org' | 'members' | 'invitations'): T | null {
  const userId = getDevCloudUserId();
  if (!userId || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(orgStorageKey(kind, userId));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeOrgValue<T>(kind: 'org' | 'members' | 'invitations', value: T): void {
  const userId = getDevCloudUserId();
  if (!userId || typeof window === 'undefined') return;
  window.localStorage.setItem(orgStorageKey(kind, userId), JSON.stringify(value));
}

/** Derive a display name/email for the active dev mock user. */
function getMockSelf(): { id: string; email: string; full_name: string } {
  const userId = getDevCloudUserId() ?? 'dev-user';
  const match = userId.match(/^dev-(\w+)-user$/);
  const tier = match ? match[1] : 'user';
  const label = tier.charAt(0).toUpperCase() + tier.slice(1);
  return {
    id: userId,
    email: `dev-${tier}@tmcstudio.test`,
    full_name: `Test ${label} User`,
  };
}

export function getMyOrganization(): { organization: Organization; role: OrgRole } | null {
  const org = readOrgValue<Organization>('org');
  if (!org) return null;
  const members = readOrgValue<OrganizationMember[]>('members') ?? [];
  const self = getMockSelf();
  const member = members.find((m) => m.user_id === self.id);
  return { organization: org, role: member?.role ?? 'owner' };
}

export function createOrganization(name: string): Organization {
  const self = getMockSelf();
  const org: Organization = {
    id: uuid(),
    name,
    owner_id: self.id,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  const member: OrganizationMember = {
    id: uuid(),
    organization_id: org.id,
    user_id: self.id,
    role: 'owner',
    invited_by: null,
    created_at: nowIso(),
    email: self.email,
    full_name: self.full_name,
  };
  writeOrgValue('org', org);
  writeOrgValue('members', [member]);
  writeOrgValue('invitations', []);
  return org;
}

export function updateOrganization(updates: { name: string }): void {
  const org = readOrgValue<Organization>('org');
  if (!org) throw new Error('Club not found');
  writeOrgValue('org', { ...org, ...updates, updated_at: nowIso() });
}

export function getOrgMembers(): OrganizationMember[] {
  return readOrgValue<OrganizationMember[]>('members') ?? [];
}

export function removeOrgMember(memberId: string): void {
  const members = readOrgValue<OrganizationMember[]>('members') ?? [];
  const member = members.find((m) => m.id === memberId);
  if (member?.role === 'owner') {
    throw new Error('The club owner cannot be removed. Transfer ownership first, or delete the club.');
  }
  writeOrgValue('members', members.filter((m) => m.id !== memberId));
}

export function transferOrgOwnership(_newOwnerUserId: string): void {
  // A dev mock session only ever has one member (the signed-in test user),
  // so there's never anyone else to transfer ownership to.
  throw new Error('There are no other members to transfer ownership to');
}

export function deleteMyOrganization(): void {
  const userId = getDevCloudUserId();
  if (!userId || typeof window === 'undefined') return;
  window.localStorage.removeItem(orgStorageKey('org', userId));
  window.localStorage.removeItem(orgStorageKey('members', userId));
  window.localStorage.removeItem(orgStorageKey('invitations', userId));
}

export function getOrgInvitations(): Invitation[] {
  return readOrgValue<Invitation[]>('invitations') ?? [];
}

export function createOrgInvitation(organizationId: string, email: string): Invitation {
  const invitations = readOrgValue<Invitation[]>('invitations') ?? [];
  if (invitations.some((inv) => inv.email === email && inv.status === 'pending')) {
    throw new Error('There is already a pending invitation for this email');
  }
  const self = getMockSelf();
  const invitation: Invitation = {
    id: uuid(),
    organization_id: organizationId,
    email,
    role: 'member',
    token: uuid(),
    status: 'pending',
    invited_by: self.id,
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: null,
    created_at: nowIso(),
  };
  writeOrgValue('invitations', [invitation, ...invitations]);
  return invitation;
}

export function revokeOrgInvitation(invitationId: string): void {
  const invitations = readOrgValue<Invitation[]>('invitations') ?? [];
  const idx = invitations.findIndex((inv) => inv.id === invitationId);
  if (idx === -1) return;
  invitations[idx] = { ...invitations[idx], status: 'revoked' };
  writeOrgValue('invitations', invitations);
}

export function getOrgSeatUsage(): number {
  const members = readOrgValue<OrganizationMember[]>('members') ?? [];
  const invitations = readOrgValue<Invitation[]>('invitations') ?? [];
  return members.length + invitations.filter((inv) => inv.status === 'pending').length;
}
