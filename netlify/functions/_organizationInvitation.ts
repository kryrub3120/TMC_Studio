export type InvitationLocale = 'en' | 'pl' | 'es';

export class InvitationRequestError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'InvitationRequestError';
  }
}

export function normalizeInvitationLocale(value: unknown): InvitationLocale {
  return value === 'pl' || value === 'es' ? value : 'en';
}

export function normalizeInvitationEmail(value: unknown): string {
  if (typeof value !== 'string') {
    throw new InvitationRequestError(
      'invalidEmail',
      400,
      'A valid email is required'
    );
  }

  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InvitationRequestError(
      'invalidEmail',
      400,
      'A valid email is required'
    );
  }
  return email;
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export function assertInvitationPermission(input: {
  role?: string | null;
  subscriptionTier?: string | null;
  seatUsage: number;
  maxSeats?: number;
}): void {
  if (input.role !== 'owner') {
    throw new InvitationRequestError(
      'notAuthorized',
      403,
      'Only the club owner can invite members'
    );
  }
  if (input.subscriptionTier !== 'team') {
    throw new InvitationRequestError(
      'teamRequired',
      403,
      'A Team subscription is required'
    );
  }
  if (input.seatUsage >= (input.maxSeats ?? 5)) {
    throw new InvitationRequestError(
      'seatLimitReached',
      409,
      'The Team seat limit has been reached'
    );
  }
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character
  );
}

const copy = {
  en: {
    subject: (club: string) => `Invitation to join ${club} in TMC Studio`,
    title: 'You have been invited',
    intro: (inviter: string, club: string) =>
      `${inviter} invited you to join ${club} in TMC Studio.`,
    description: 'Accept the invitation to collaborate with your club staff.',
    cta: 'Accept invitation',
    expires:
      'This secure invitation expires in 14 days and can only be accepted by this email address.',
    ignore:
      'If you were not expecting this invitation, you can ignore this email.',
  },
  pl: {
    subject: (club: string) => `Zaproszenie do ${club} w TMC Studio`,
    title: 'Otrzymałeś zaproszenie',
    intro: (inviter: string, club: string) =>
      `${inviter} zaprasza Cię do klubu ${club} w TMC Studio.`,
    description:
      'Przyjmij zaproszenie, aby współpracować ze sztabem swojego klubu.',
    cta: 'Przyjmij zaproszenie',
    expires:
      'To bezpieczne zaproszenie wygasa za 14 dni i może je przyjąć tylko właściciel tego adresu email.',
    ignore: 'Jeśli nie spodziewałeś się tej wiadomości, możesz ją zignorować.',
  },
  es: {
    subject: (club: string) => `Invitación a ${club} en TMC Studio`,
    title: 'Has recibido una invitación',
    intro: (inviter: string, club: string) =>
      `${inviter} te invita a unirte a ${club} en TMC Studio.`,
    description: 'Acepta la invitación para colaborar con el staff de tu club.',
    cta: 'Aceptar invitación',
    expires:
      'Esta invitación segura caduca en 14 días y solo puede aceptarla el propietario de este correo.',
    ignore: 'Si no esperabas esta invitación, puedes ignorar este mensaje.',
  },
};

export function buildOrganizationInvitationEmail(input: {
  locale: InvitationLocale;
  organizationName: string;
  inviterName: string;
  inviteUrl: string;
}): { subject: string; htmlBody: string; textBody: string } {
  const strings = copy[input.locale];
  const organizationName = escapeHtml(input.organizationName);
  const inviterName = escapeHtml(input.inviterName);
  const inviteUrl = escapeHtml(input.inviteUrl);
  const subject = strings.subject(input.organizationName).slice(0, 180);
  const intro = strings.intro(inviterName, organizationName);

  const htmlBody = `<!doctype html>
<html lang="${input.locale}"><body style="margin:0;background:#0b1220;color:#e5e7eb;font-family:Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1220;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#111827;border:1px solid #263247;border-radius:8px">
<tr><td style="padding:26px 32px;border-bottom:1px solid #263247;font-size:20px;font-weight:700;color:#fff">TMC Studio</td></tr>
<tr><td style="padding:32px"><h1 style="margin:0 0 14px;font-size:24px;color:#fff">${strings.title}</h1>
<p style="margin:0 0 10px;line-height:1.6;color:#b8c2d1">${intro}</p>
<p style="margin:0 0 24px;line-height:1.6;color:#b8c2d1">${strings.description}</p>
<a href="${inviteUrl}" style="display:inline-block;background:#20d997;color:#07130f;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:6px">${strings.cta}</a>
<p style="margin:26px 0 8px;line-height:1.5;color:#8f9bad;font-size:13px">${strings.expires}</p>
<p style="margin:0;color:#66758b;font-size:12px">${strings.ignore}</p>
<p style="margin:12px 0 0;word-break:break-all;color:#66758b;font-size:11px">${inviteUrl}</p></td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid #263247;color:#66758b;font-size:12px">TMC Studio · tmcstudio.app · support@tacticsmadeclear.store</td></tr>
</table></td></tr></table></body></html>`;

  return {
    subject,
    htmlBody,
    textBody: `${strings.title}\n\n${strings.intro(input.inviterName, input.organizationName)}\n${strings.description}\n\n${input.inviteUrl}\n\n${strings.expires}\n${strings.ignore}`,
  };
}
