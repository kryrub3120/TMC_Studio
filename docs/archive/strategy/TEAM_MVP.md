# Team Plan MVP

This document defines the scope and implementation plan for TMC Studio's Team plan (multi-user collaboration).

**Status:** 🔮 Future (Post-V1)

---

## Overview

The Team plan enables organizations to:
- Share projects across multiple users
- Collaborate on tactical boards
- Manage team members and permissions
- Access advanced analytics (future)

**Philosophy:** Ship the minimum viable Team plan first, then iterate based on feedback.

---

## MVP Scope

### ✅ IN SCOPE (Team MVP)

#### 1. Multi-Seat Billing
- 5 seats per Team workspace
- Billing owner can add/remove members
- Each member has their own login
- Billing via Stripe subscriptions

#### 2. Shared Workspace
- Team workspace with shared project library
- All team members see same projects
- Projects belong to workspace, not individual users
- Simple list view (no complex project management yet)

#### 3. Basic Permissions
**Two roles:**
- **Admin** - Can manage members, billing, all projects
- **Member** - Can view/edit projects, cannot manage workspace

**Permissions matrix:**

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ |
| Edit any project | ✅ | ✅ |
| Delete project | ✅ | ❌ |
| Invite member | ✅ | ❌ |
| Remove member | ✅ | ❌ |
| Manage billing | ✅ | ❌ |

#### 4. Invite Flow
- Admin enters email addresses
- System sends invite link
- Recipient clicks link → creates account → joins workspace
- Invites expire after 7 days

#### 5. Project Ownership
- Projects owned by workspace (not users)
- Last-write-wins (no conflict resolution)
- Simple "who's editing" indicator (optional)

---

### 🚫 OUT OF SCOPE (Team MVP)

These are explicitly NOT included in MVP:

#### ❌ Real-Time Collaboration
- No multiplayer canvas
- No live cursors
- No simultaneous editing
- **Why:** Complex, requires WebSockets/CRDT, high-risk for MVP

#### ❌ Comments & Annotations
- No inline comments
- No feedback system
- No @mentions
- **Why:** UX complexity, not core Team value

#### ❌ Version History
- No branching
- No version comparison
- No restore to previous version
- **Why:** Can ship later as add-on feature

#### ❌ Advanced Permissions
- No per-project permissions
- No custom roles
- No read-only access
- **Why:** Keep it simple first, add if users request

#### ❌ Team Analytics
- No usage dashboards
- No team insights
- No performance metrics
- **Why:** Defer until we have data on what's useful

#### ❌ SSO / SAML
- No single sign-on
- No enterprise auth
- **Why:** Wait for enterprise customers first

#### ❌ White-Label
- No custom branding
- No custom domains
- **Why:** Not core Team value

---

## Database Schema

### New Tables

#### `workspaces`
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users(id),
  max_seats INT DEFAULT 5,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT -- 'active', 'canceled', 'past_due'
);
```

#### `workspace_members`
```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);
```

#### `workspace_invites`
```sql
CREATE TABLE workspace_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  UNIQUE(workspace_id, email)
);
```

### Modified Tables

#### `cloud_projects` (add workspace_id)
```sql
ALTER TABLE cloud_projects
ADD COLUMN workspace_id UUID REFERENCES workspaces(id);

-- Migration: NULL workspace_id = personal project
```

---

## Entitlements Updates

### Team Plan Entitlements

```typescript
// In entitlements.ts
const ENTITLEMENTS_BY_PLAN = {
  // ... existing plans
  team: {
    maxProjects: 'unlimited',
    maxStepsPerProject: 'unlimited',
    maxFolders: 'unlimited',
    cloudSync: true,
    canExportPNG: true,
    canExportGIF: true,
    canExportPDF: true,
    maxSeats: 5,
    canInviteMembers: true, // NEW
    canShareProjects: false, // Future: shared library
    hasWorkspace: true, // NEW
  },
};
```

### New Actions

```typescript
type EntitledAction =
  | /* existing actions */
  | 'inviteMember'
  | 'removeMember'
  | 'manageBilling'
  | 'deleteWorkspaceProject';
```

---

## UI Components

### New Components

#### WorkspaceSettingsModal
- Workspace name
- Member list with roles
- Invite form
- Remove member (admins only)
- Leave workspace option

#### InviteMemberModal
- Email input (comma-separated)
- Role selector (admin/member)
- Send invites button
- Pending invites list

#### WorkspaceSwitcher (TopBar)
- Switch between personal / workspace views
- Create new workspace (if Pro user)
- Visual indicator of current context

#### TeamProjectsDrawer
- Extends ProjectsDrawer
- Shows workspace projects
- Filter by creator
- Shows "who last edited"

---

## User Flows

### Flow 1: Create Team Workspace

```
Pro user clicks "Upgrade to Team"
  ↓
PricingModal → Stripe Checkout (Team plan)
  ↓
Payment success → Create workspace
  ↓
User becomes workspace owner (admin)
  ↓
Workspace settings modal opens
  ↓
User can invite team members
```

### Flow 2: Invite Team Member

```
Admin opens workspace settings
  ↓
Clicks "Invite members"
  ↓
Enters emails: "john@company.com, jane@company.com"
  ↓
Selects role: Member
  ↓
System creates invites
  ↓
Sends email with invite link
  ↓
Recipients receive email with CTAs
```

### Flow 3: Accept Invite

```
Recipient clicks invite link
  ↓
IF not logged in:
  → AuthModal (sign up/sign in)
  ↓
Accept invite → Join workspace
  ↓
Redirect to workspace view
  ↓
Can see all workspace projects
```

### Flow 4: Create Workspace Project

```
User in workspace context
  ↓
Clicks "New Project"
  ↓
Project created in workspace
  ↓
All team members can see it
  ↓
Project shows "Created by [name]"
```

---

## State Management

### New Store Slice

```typescript
// workspaceSlice.ts
interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  members: WorkspaceMember[];
  invites: WorkspaceInvite[];
  
  // Actions
  createWorkspace: (name: string) => Promise<void>;
  switchWorkspace: (id: string) => void;
  inviteMember: (email: string, role: 'admin' | 'member') => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  leaveWorkspace: () => Promise<void>;
}
```

### Context Switching

```typescript
// When in workspace context:
- ProjectsDrawer shows workspace projects
- New projects created in workspace
- Entitlements checked against workspace plan

// When in personal context:
- ProjectsDrawer shows personal projects
- New projects created in personal space
- Entitlements checked against user plan
```

---

## Pricing

### Team Plan Pricing

**Base Plan:**
- $49/month (5 seats)
- Unlimited projects
- Unlimited steps
- All Pro features
- Workspace collaboration

**Additional Seats:**
- $9/month per seat (if we add this later)

**Annual Discount:**
- $490/year ($40.83/month)
- Save ~17%

---

## Stripe Integration

### Subscription Metadata

```typescript
// Stripe subscription metadata
{
  plan: 'team',
  workspaceId: 'uuid',
  maxSeats: 5,
  seats: 3, // Current usage (future)
}
```

### Webhooks

Add handling for:
- `customer.subscription.created` → Create workspace
- `customer.subscription.updated` → Update workspace settings
- `customer.subscription.deleted` → Downgrade workspace to Pro (retain data)

---

## Migration Path

### From Pro to Team

```
User has Pro plan ($19/month)
  ↓
Clicks "Upgrade to Team"
  ↓
Stripe: Cancel Pro, create Team subscription
  ↓
Prorated billing
  ↓
Create workspace, user becomes admin
  ↓
Personal projects remain personal
  ↓
User can create new workspace projects
```

### From Team to Pro (Downgrade)

```
User cancels Team subscription
  ↓
Workspace projects become read-only
  ↓
Members lose access (but their accounts remain)
  ↓
Admin retains access to projects (moved to personal)
  ↓
Invite links expire
  ↓
User still has Pro features
```

---

## Implementation Phases

### Phase 1: Infrastructure (2 weeks)
- Database schema
- Supabase RLS policies
- Workspace store slice
- Migration scripts

### Phase 2: Billing (1 week)
- Stripe Team plan integration
- Upgrade/downgrade flows
- Webhook handlers
- Prorated billing

### Phase 3: Invite System (1 week)
- Invite modal
- Email templates (transactional)
- Invite link handling
- Accept/decline flows

### Phase 4: UI Components (2 weeks)
- WorkspaceSettingsModal
- WorkspaceSwitcher
- TeamProjectsDrawer
- Member management UI

### Phase 5: Testing & Polish (1 week)
- End-to-end testing
- Edge cases (invite expired, member removed, etc.)
- UX polish
- Documentation

**Total: ~7 weeks**

---

## Edge Cases

### What happens if...

**User is invited to multiple workspaces?**
- They can be member of multiple workspaces
- Switch via WorkspaceSwitcher
- Each workspace is independent

**Workspace owner cancels subscription?**
- Workspace becomes read-only
- Projects retained for 30 days
- Members notified via email
- After 30 days: projects archived/deleted

**Member is removed from workspace?**
- Loses access immediately
- No longer sees workspace projects
- Their personal projects unaffected

**Two members edit same project simultaneously?**
- Last-write-wins
- No conflict resolution in MVP
- Consider warning: "John is editing this project"

**Invite expires before acceptance?**
- User clicks link → "Invite expired"
- Admin can resend invite
- Old invite invalidated

---

## Success Metrics

### KPIs for Team MVP

- **Conversion:** Pro → Team upgrade rate
- **Activation:** % of Team workspaces that invite >1 member
- **Engagement:** Projects created in workspace context
- **Retention:** Team subscription renewal rate

**Target:**
- 10% of Pro users upgrade to Team
- 80% of Team workspaces invite at least 2 members
- 90% Team retention after 3 months

---

## Post-MVP Enhancements

Only after MVP is stable and validated:

1. **Real-time collaboration** - Multiplayer canvas
2. **Comments** - Inline feedback system
3. **Version history** - Restore previous versions
4. **Advanced permissions** - Per-project access control
5. **Activity log** - Who did what, when
6. **Team analytics** - Usage dashboard
7. **SSO** - Enterprise authentication
8. **Additional seats** - Buy more than 5 seats
9. **Custom roles** - Define custom permissions

---

## Related Documentation

- **Entitlements:** `docs/ENTITLEMENTS.md`
- **Architecture:** `docs/ARCHITECTURE_OVERVIEW.md`
- **Monetization:** `docs/MONETIZATION_PLAN.md`
- **Product Philosophy:** `docs/PRODUCT_PHILOSOPHY.md`

---

**Remember:** MVP means shipping the minimum to validate Team demand. Ship fast, learn, iterate. Don't gold-plate.
