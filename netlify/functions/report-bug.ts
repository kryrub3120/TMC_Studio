import type { Handler, HandlerEvent } from '@netlify/functions';
import { getCorsHeaders, handlePreflight } from './_cors';
import { checkRateLimit } from './_rateLimit';

const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const reply = (statusCode: number, headers: Record<string, string>, body: object) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});

export const handler: Handler = async (event: HandlerEvent) => {
  const origin = typeof event.headers.origin === 'string' ? event.headers.origin : undefined;
  const cors = getCorsHeaders(origin);
  if (!cors) return { statusCode: 403, body: JSON.stringify({ error: 'Origin not allowed' }) };
  const preflight = handlePreflight(event);
  if (preflight) return preflight;
  if (event.httpMethod !== 'POST') return reply(405, cors.headers, { error: 'Method not allowed' });

  const clientIp = String(event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown').split(',')[0];
  const rate = checkRateLimit(`bug:${clientIp}`, { maxRequests: 3, windowMs: 15 * 60_000 });
  if (!rate.allowed) return reply(429, { ...cors.headers, 'Retry-After': String(rate.retryAfter) }, { error: 'Too many requests', code: 'rateLimited' });
  if (!process.env.POSTMARK_SERVER_TOKEN) return reply(500, cors.headers, { error: 'Feedback service is not configured' });

  let data: Record<string, unknown>;
  try { data = JSON.parse(event.body || '{}') as Record<string, unknown>; }
  catch { return reply(400, cors.headers, { error: 'Invalid request' }); }

  const title = clean(data.title, 120);
  const description = clean(data.description, 5000);
  const steps = clean(data.steps, 3000);
  const expected = clean(data.expected, 2000);
  const email = clean(data.email, 254);
  const context = clean(data.context, 1500);
  const website = clean(data.website, 200);
  if (website) return reply(200, cors.headers, { ok: true });
  if (title.length < 5 || description.length < 15) return reply(400, cors.headers, { error: 'Title and description are required', code: 'invalidRequest' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, cors.headers, { error: 'Invalid email', code: 'invalidEmail' });

  const textBody = [
    `TMC Studio bug report: ${title}`,
    '', description,
    steps ? `\nSteps to reproduce:\n${steps}` : '',
    expected ? `\nExpected result:\n${expected}` : '',
    email ? `\nReply email: ${email}` : '',
    context ? `\nTechnical context:\n${context}` : '',
  ].join('\n');
  const htmlBody = `<h2>${escapeHtml(title)}</h2><h3>Description</h3><p>${escapeHtml(description).replaceAll('\n', '<br>')}</p>${steps ? `<h3>Steps to reproduce</h3><p>${escapeHtml(steps).replaceAll('\n', '<br>')}</p>` : ''}${expected ? `<h3>Expected result</h3><p>${escapeHtml(expected).replaceAll('\n', '<br>')}</p>` : ''}${email ? `<p><strong>Reply email:</strong> ${escapeHtml(email)}</p>` : ''}${context ? `<h3>Technical context</h3><pre>${escapeHtml(context)}</pre>` : ''}`;

  try {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN },
      body: JSON.stringify({
        From: 'TMC Studio <support@tacticsmadeclear.store>',
        To: 'support@tacticsmadeclear.store',
        ReplyTo: email || undefined,
        Subject: `[Bug] ${title}`,
        TextBody: textBody,
        HtmlBody: htmlBody,
        MessageStream: 'outbound',
        Tag: 'bug-report',
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Postmark ${response.status}`);
    return reply(200, cors.headers, { ok: true });
  } catch (error) {
    console.error('Bug report delivery failed', error);
    return reply(502, cors.headers, { error: 'Could not send report', code: 'deliveryFailed' });
  }
};
