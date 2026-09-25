/**
 * Fails when the deployed web bundle (apps/web/dist) contains a server-side
 * secret: a Supabase service_role key, a Supabase secret key, Stripe secret /
 * restricted / webhook keys, a private key, or the names of server-only
 * environment variables (a sign that server code or config was bundled).
 *
 * The Supabase anon key is a JWT too; it is public and allowed. Only JWTs
 * whose payload says role=service_role are reported.
 *
 * Usage: node scripts/check-bundle-secrets.mjs [dir]   (default apps/web/dist)
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCANNED_EXTENSIONS = new Set(['.js', '.mjs', '.html', '.css', '.json', '.map', '.txt', '.webmanifest', '.xml']);

/** Server-only variables used by netlify/functions. Their names must never reach the browser. */
const SERVER_ENV_NAMES = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'POSTMARK_SERVER_TOKEN',
];

const PATTERNS = [
  { kind: 'Supabase secret key', regex: /\bsb_secret_[A-Za-z0-9_-]{10,}/g },
  { kind: 'Stripe secret key', regex: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}/g },
  { kind: 'Stripe webhook secret', regex: /\bwhsec_[A-Za-z0-9]{10,}/g },
  { kind: 'Private key', regex: /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g },
];

const JWT = /eyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{8,}/g;

function jwtRole(payloadSegment) {
  try {
    const json = Buffer.from(payloadSegment.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json).role ?? null;
  } catch {
    return null;
  }
}

/** Show only the start of a secret in the report. */
function redact(value) {
  return `${value.slice(0, 12)}…`;
}

/**
 * Secrets found in one file's text. `checkEnvNames: false` skips the
 * variable-name check (used for third-party sources in source maps, whose
 * docs mention e.g. SUPABASE_SERVICE_ROLE_KEY in examples).
 */
export function findSecrets(text, { checkEnvNames = true } = {}) {
  const findings = [];

  for (const { kind, regex } of PATTERNS) {
    for (const match of text.matchAll(regex)) findings.push({ kind, sample: redact(match[0]) });
  }

  for (const match of text.matchAll(JWT)) {
    if (jwtRole(match[1]) === 'service_role') {
      findings.push({ kind: 'Supabase service_role key', sample: redact(match[0]) });
    }
  }

  for (const name of checkEnvNames ? SERVER_ENV_NAMES : []) {
    if (new RegExp(`\\b${name}\\b`).test(text)) {
      findings.push({ kind: 'Server-only env variable name', sample: name });
    }
  }

  return findings;
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return files.flat();
}

/** Findings in a source map: app sources fully, library sources for secret values only. */
function findSecretsInSourceMap(text) {
  let map;
  try {
    map = JSON.parse(text);
  } catch {
    return findSecrets(text);
  }
  const sources = map.sources ?? [];
  return (map.sourcesContent ?? []).flatMap((content, index) =>
    content ? findSecrets(content, { checkEnvNames: !String(sources[index] ?? '').includes('node_modules') }) : [],
  );
}

/** Findings for every scanned file under `dir`. */
export async function scanDirectory(dir) {
  const results = [];
  for (const file of await listFiles(dir)) {
    if (!SCANNED_EXTENSIONS.has(extname(file))) continue;
    const text = await readFile(file, 'utf8');
    const findings = extname(file) === '.map' ? findSecretsInSourceMap(text) : findSecrets(text);
    for (const finding of findings) results.push({ file: relative(dir, file), ...finding });
  }
  return results;
}

async function main() {
  const dir = process.argv[2] ?? fileURLToPath(new URL('../apps/web/dist/', import.meta.url));
  if (!(await stat(dir).catch(() => null))?.isDirectory()) {
    console.error(`Bundle directory not found: ${dir}. Run the build first.`);
    process.exit(2);
  }

  const results = await scanDirectory(dir);
  if (results.length > 0) {
    console.error('Secrets found in the web bundle:');
    for (const { file, kind, sample } of results) console.error(`  ${file}: ${kind} (${sample})`);
    process.exit(1);
  }
  console.log(`No secrets found in ${relative(process.cwd(), dir) || dir}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
