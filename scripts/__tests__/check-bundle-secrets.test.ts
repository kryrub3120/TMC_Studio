import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain ESM script without type declarations
import { findSecrets, scanDirectory } from '../check-bundle-secrets.mjs';

// Fake secrets are assembled at runtime so no secret-looking literal is committed.
const b64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
const jwt = (role: string) => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ iss: 'supabase', role })}.${'s'.repeat(43)}`;
const stripeSecret = ['sk', 'live', 'a1B2c3D4e5F6g7H8i9J0'].join('_');
const restrictedKey = ['rk', 'test', 'Z9y8X7w6V5u4T3s2R1q0'].join('_');
const webhookSecret = ['whsec', 'Abcdefghijklmnop123456'].join('_');
const supabaseSecret = ['sb', 'secret', 'Qwertyuiopasdfghjkl'].join('_');

type Finding = { kind: string; sample: string };
const kinds = (text: string) => (findSecrets(text) as Finding[]).map((f) => f.kind);

describe('bundle secret scan', () => {
  it('allows the public Supabase anon key and ordinary code', () => {
    expect(kinds(`const key="${jwt('anon')}";fetch(url,{headers:{apikey:key}})`)).toEqual([]);
    expect(kinds('const sk_live = 1; // mentions sk_live_ without a key')).toEqual([]);
  });

  it('reports a service_role key', () => {
    expect(kinds(`createClient(u,"${jwt('service_role')}")`)).toEqual(['Supabase service_role key']);
  });

  it('reports Stripe and Supabase secret keys and private keys', () => {
    expect(kinds(`a="${stripeSecret}";b="${restrictedKey}";c="${webhookSecret}";d="${supabaseSecret}"`)).toEqual([
      'Supabase secret key',
      'Stripe secret key',
      'Stripe secret key',
      'Stripe webhook secret',
    ]);
    expect(kinds(['-----BEGIN', 'PRIVATE KEY-----'].join(' '))).toEqual(['Private key']);
  });

  it('reports names of server-only environment variables', () => {
    expect(kinds('process.env.STRIPE_SECRET_KEY')).toEqual(['Server-only env variable name']);
    expect(kinds('SUPABASE_SERVICE_ROLE_KEY')).toEqual(['Server-only env variable name']);
  });

  it('never prints a whole secret', () => {
    const [finding] = findSecrets(`x="${stripeSecret}"`) as Finding[];
    expect(finding.sample).not.toContain(stripeSecret);
    expect(finding.sample.endsWith('…')).toBe(true);
  });

  it('scans nested bundle files and skips binary assets', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bundle-'));
    await mkdir(join(dir, 'assets'));
    await writeFile(join(dir, 'assets', 'app.js'), `const k="${stripeSecret}"`);
    await writeFile(join(dir, 'index.html'), '<html></html>');
    await writeFile(join(dir, 'assets', 'logo.png'), stripeSecret);

    const results = await scanDirectory(dir);
    expect(results).toEqual([{ file: join('assets', 'app.js'), kind: 'Stripe secret key', sample: expect.any(String) }]);
  });

  it('in source maps ignores env names in library docs but still finds secret values', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bundle-map-'));
    const map = {
      version: 3,
      sources: ['../node_modules/@supabase/auth-js/GoTrueAdminApi.js', '../../src/lib/admin.ts', '../node_modules/lib/leak.js'],
      sourcesContent: [
        '// Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`',
        'const k = process.env.STRIPE_SECRET_KEY',
        `const k = "${stripeSecret}"`,
      ],
    };
    await writeFile(join(dir, 'app.js.map'), JSON.stringify(map));

    const results = (await scanDirectory(dir)) as Array<{ kind: string; sample: string }>;
    expect(results.map((r) => `${r.kind}:${r.sample.slice(0, 7)}`)).toEqual([
      'Server-only env variable name:STRIPE_',
      'Stripe secret key:sk_live',
    ]);
  });
});

