import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HandlerEvent } from '@netlify/functions';
import { handler } from '../report-bug';

const event = (overrides: Partial<HandlerEvent> = {}) => ({
  httpMethod: 'POST',
  headers: {
    origin: 'https://tmcstudio.app',
    'x-forwarded-for': `report-test-${Math.random()}`,
  },
  body: JSON.stringify({
    title: 'Preset menu issue',
    description: 'The preset action menu is outside the visible workspace.',
    context: 'TMC Studio 0.13.0',
  }),
  ...overrides,
} as HandlerEvent);

describe('public bug reporting', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('rejects disallowed origins', async () => {
    const response = await handler(event({ headers: { origin: 'https://example.com' } }), {} as never);
    expect(response).toMatchObject({ statusCode: 403 });
  });

  it('validates required report details before delivery', async () => {
    vi.stubEnv('POSTMARK_SERVER_TOKEN', 'test-token');
    const response = await handler(event({ body: JSON.stringify({ title: 'No', description: 'Too short' }) }), {} as never);
    expect(response).toMatchObject({ statusCode: 400 });
  });

  it('delivers a sanitized report through Postmark', async () => {
    vi.stubEnv('POSTMARK_SERVER_TOKEN', 'test-token');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const response = await handler(event({ body: JSON.stringify({
      title: '<b>Preset menu issue</b>',
      description: 'The preset action menu is outside the visible workspace.',
      email: 'coach@example.com',
    }) }), {} as never);

    expect(response).toMatchObject({ statusCode: 200 });
    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(request.ReplyTo).toBe('coach@example.com');
    expect(request.HtmlBody).not.toContain('<b>Preset menu issue</b>');
    expect(request.HtmlBody).toContain('&lt;b&gt;Preset menu issue&lt;/b&gt;');
  });
});
