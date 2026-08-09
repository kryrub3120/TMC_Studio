import type { Handler, HandlerEvent } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth, AuthError } from './_auth';
import { getCorsHeaders, handlePreflight } from './_cors';
import { checkRateLimit } from './_rateLimit';
import {
  assertInvitationPermission,
  buildOrganizationInvitationEmail,
  isUuid,
  InvitationRequestError,
  normalizeInvitationEmail,
  normalizeInvitationLocale,
} from './_organizationInvitation';

const MAX_TEAM_SEATS = 5;

function response(
  statusCode: number,
  cors: { headers: Record<string, string> },
  body: object
) {
  return { statusCode, ...cors, body: JSON.stringify(body) };
}

export const handler: Handler = async (event: HandlerEvent) => {
  const origin =
    typeof event.headers.origin === 'string' ? event.headers.origin : undefined;
  const cors = getCorsHeaders(origin);
  if (!cors)
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Origin not allowed' }),
    };

  const preflight = handlePreflight(event);
  if (preflight) return preflight;
  if (event.httpMethod !== 'POST')
    return response(405, cors, { error: 'Method not allowed' });

  const clientIp =
    event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  const rateCheck = checkRateLimit(
    Array.isArray(clientIp) ? clientIp[0] : clientIp,
    {
      maxRequests: 5,
      windowMs: 60_000,
    }
  );
  if (!rateCheck.allowed) {
    return {
      statusCode: 429,
      headers: { ...cors.headers, 'Retry-After': String(rateCheck.retryAfter) },
      body: JSON.stringify({ error: 'Too many requests', code: 'rateLimited' }),
    };
  }

  if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.POSTMARK_SERVER_TOKEN
  ) {
    console.error(
      'Organization invitation service is missing required configuration'
    );
    return response(500, cors, {
      error: 'Invitation service is not configured',
      code: 'configurationError',
    });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  let invitationId: string | null = null;

  try {
    const authUser = await verifyAuth(event.headers.authorization);
    const body = JSON.parse(event.body || '{}') as {
      organizationId?: unknown;
      email?: unknown;
      locale?: unknown;
    };
    if (!isUuid(body.organizationId)) {
      throw new InvitationRequestError(
        'invalidRequest',
        400,
        'A valid organization is required'
      );
    }

    const organizationId = body.organizationId;
    const email = normalizeInvitationEmail(body.email);
    const locale = normalizeInvitationLocale(body.locale);

    const [
      membershipResult,
      profileResult,
      organizationResult,
      memberCountResult,
      pendingCountResult,
    ] = await Promise.all([
      supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', authUser.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('full_name, subscription_tier')
        .eq('id', authUser.id)
        .single(),
      supabase
        .from('organizations')
        .select('id, name')
        .eq('id', organizationId)
        .single(),
      supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId),
      supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'pending'),
    ]);

    if (
      membershipResult.error ||
      profileResult.error ||
      organizationResult.error
    ) {
      throw new InvitationRequestError(
        'notAuthorized',
        403,
        'Organization access denied'
      );
    }
    if (memberCountResult.error || pendingCountResult.error) {
      throw new InvitationRequestError(
        'inviteFailed',
        500,
        'Could not verify the Team seat limit'
      );
    }

    assertInvitationPermission({
      role: membershipResult.data?.role,
      subscriptionTier: profileResult.data?.subscription_tier,
      seatUsage:
        (memberCountResult.count ?? 0) + (pendingCountResult.count ?? 0),
      maxSeats: MAX_TEAM_SEATS,
    });

    const { data: existingProfile, error: existingProfileError } =
      await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
    if (existingProfileError) throw existingProfileError;
    if (existingProfile) {
      const { data: existingMembership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', existingProfile.id)
        .maybeSingle();
      if (existingMembership)
        throw new InvitationRequestError(
          'alreadyMember',
          409,
          'This user is already a club member'
        );
    }

    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        organization_id: organizationId,
        email,
        role: 'member',
        invited_by: authUser.id,
      })
      .select('*')
      .single();

    if (invitationError) {
      if (invitationError.code === '23505') {
        throw new InvitationRequestError(
          'alreadyPending',
          409,
          'An invitation is already pending for this email'
        );
      }
      throw invitationError;
    }

    invitationId = invitation.id;
    const inviteUrl = `https://tmcstudio.app/invite?token=${encodeURIComponent(invitation.token)}&lang=${locale}`;
    const inviterName =
      profileResult.data.full_name?.trim() || authUser.email || 'TMC Studio';
    const emailContent = buildOrganizationInvitationEmail({
      locale,
      organizationName: organizationResult.data.name,
      inviterName,
      inviteUrl,
    });

    const postmarkResponse = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN,
      },
      body: JSON.stringify({
        From: 'TMC Studio <support@tacticsmadeclear.store>',
        To: email,
        Subject: emailContent.subject,
        HtmlBody: emailContent.htmlBody,
        TextBody: emailContent.textBody,
        MessageStream: 'outbound',
        Tag: 'organization-invitation',
        Metadata: {
          organization_id: organizationId,
          invitation_id: invitation.id,
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!postmarkResponse.ok) {
      const postmarkError = await postmarkResponse.text();
      console.error(
        'Postmark invitation delivery failed:',
        postmarkResponse.status,
        postmarkError.slice(0, 500)
      );
      await supabase.from('invitations').delete().eq('id', invitation.id);
      invitationId = null;
      throw new InvitationRequestError(
        'deliveryFailed',
        502,
        'The invitation email could not be sent'
      );
    }

    const postmarkResult = (await postmarkResponse
      .json()
      .catch(() => null)) as { MessageID?: string } | null;
    console.info('Organization invitation delivered', {
      invitationId: invitation.id,
      messageId: postmarkResult?.MessageID ?? 'unknown',
    });

    return response(200, cors, { invitation });
  } catch (error) {
    if (error instanceof AuthError)
      return response(error.statusCode, cors, {
        error: error.message,
        code: 'notAuthenticated',
      });
    if (error instanceof InvitationRequestError) {
      return response(error.statusCode, cors, {
        error: error.message,
        code: error.code,
      });
    }

    if (invitationId)
      await supabase.from('invitations').delete().eq('id', invitationId);
    console.error('Organization invitation error:', error);
    return response(500, cors, {
      error: 'Could not send invitation',
      code: 'inviteFailed',
    });
  }
};
