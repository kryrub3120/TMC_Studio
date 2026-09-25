import { describe, expect, it } from 'vitest';
import { accessFromUser, derivePlan } from './entitlements';

describe('accessFromUser', () => {
  it('gives a Free club member Team access through the club', () => {
    const access = accessFromUser({
      subscription_tier: 'free',
      team_id: null,
      club_organization_id: 'org-1',
    });

    expect(access).toEqual({ isPro: true, isTeam: true, teamId: 'org-1' });
    expect(derivePlan(true, 'free', access.teamId)).toBe('team');
  });

  it('keeps a Free user without a club on Free', () => {
    expect(accessFromUser({ subscription_tier: 'free', club_organization_id: null })).toEqual({
      isPro: false,
      isTeam: false,
      teamId: null,
    });
  });

  it('keeps own plans unchanged', () => {
    expect(accessFromUser({ subscription_tier: 'pro' })).toEqual({ isPro: true, isTeam: false, teamId: null });
    expect(accessFromUser({ subscription_tier: 'team', team_id: 'team-1' })).toEqual({
      isPro: true,
      isTeam: true,
      teamId: 'team-1',
    });
  });

  it('treats a signed-out user as no access', () => {
    expect(accessFromUser(null)).toEqual({ isPro: false, isTeam: false, teamId: null });
  });
});
