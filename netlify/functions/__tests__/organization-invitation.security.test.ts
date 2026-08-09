import { describe, expect, it } from 'vitest';
import {
  assertInvitationPermission,
  buildOrganizationInvitationEmail,
  InvitationRequestError,
  isUuid,
  normalizeInvitationEmail,
  normalizeInvitationLocale,
} from '../_organizationInvitation';

describe('organization invitation validation', () => {
  it('normalizes supported locales and falls back to English', () => {
    expect(normalizeInvitationLocale('pl')).toBe('pl');
    expect(normalizeInvitationLocale('es')).toBe('es');
    expect(normalizeInvitationLocale('de')).toBe('en');
    expect(normalizeInvitationLocale(undefined)).toBe('en');
  });

  it('normalizes valid email and rejects malformed input', () => {
    expect(normalizeInvitationEmail(' Coach@Example.COM ')).toBe(
      'coach@example.com'
    );
    expect(() => normalizeInvitationEmail('not-an-email')).toThrow(
      InvitationRequestError
    );
    expect(() => normalizeInvitationEmail(null)).toThrow(
      'A valid email is required'
    );
  });

  it('accepts valid UUIDs and rejects loose 36-character values', () => {
    expect(isUuid('d69dbbe6-cc94-4e11-aaa8-988ce8442318')).toBe(true);
    expect(isUuid('------------------------------------')).toBe(false);
    expect(isUuid('not-a-uuid')).toBe(false);
  });
});

describe('organization invitation authorization', () => {
  it('allows a Team owner with an available seat', () => {
    expect(() =>
      assertInvitationPermission({
        role: 'owner',
        subscriptionTier: 'team',
        seatUsage: 4,
        maxSeats: 5,
      })
    ).not.toThrow();
  });

  it.each([
    [
      { role: 'member', subscriptionTier: 'team', seatUsage: 1 },
      'notAuthorized',
    ],
    [{ role: 'owner', subscriptionTier: 'pro', seatUsage: 1 }, 'teamRequired'],
    [
      { role: 'owner', subscriptionTier: 'team', seatUsage: 5 },
      'seatLimitReached',
    ],
  ])('rejects unauthorized invitation state', (input, expectedCode) => {
    try {
      assertInvitationPermission(input);
      throw new Error('Expected permission check to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(InvitationRequestError);
      expect((error as InvitationRequestError).code).toBe(expectedCode);
    }
  });
});

describe('organization invitation email', () => {
  const baseInput = {
    organizationName: 'FC Example',
    inviterName: 'Alex Coach',
    inviteUrl:
      'https://tmcstudio.app/invite?token=d69dbbe6-cc94-4e11-aaa8-988ce8442318&lang=en',
  };

  it.each([
    ['en' as const, 'Invitation to join FC Example', 'Accept invitation'],
    ['pl' as const, 'Zaproszenie do FC Example', 'Przyjmij zaproszenie'],
    ['es' as const, 'Invitación a FC Example', 'Aceptar invitación'],
  ])('builds localized %s content', (locale, subject, cta) => {
    const email = buildOrganizationInvitationEmail({ ...baseInput, locale });
    expect(email.subject).toContain(subject);
    expect(email.htmlBody).toContain(cta);
    expect(email.textBody).toContain(baseInput.inviteUrl);
  });

  it('escapes organization and inviter names in HTML', () => {
    const email = buildOrganizationInvitationEmail({
      ...baseInput,
      locale: 'en',
      organizationName: '<script>alert(1)</script>',
      inviterName: 'A&B',
    });
    expect(email.htmlBody).not.toContain('<script>');
    expect(email.htmlBody).toContain('&lt;script&gt;');
    expect(email.htmlBody).toContain('A&amp;B');
  });
});
