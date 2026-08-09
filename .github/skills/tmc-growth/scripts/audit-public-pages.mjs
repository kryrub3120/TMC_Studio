#!/usr/bin/env node
import { readFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const distDir = resolve(process.argv[2] || 'apps/web/dist');
const failures = [];
const checks = [];
const pageTitles = [];
const pageDescriptions = [];

function record(ok, label) {
  checks.push({ ok, label });
  if (!ok) failures.push(label);
}

function matches(html, pattern) {
  return html.match(pattern) ?? [];
}

const sitemapPath = join(distDir, 'sitemap.xml');
await access(sitemapPath);
const sitemap = await readFile(sitemapPath, 'utf8');
const urls = [...sitemap.matchAll(/<loc>(https:\/\/tmcstudio\.app([^<]*))<\/loc>/g)]
  .map((match) => ({ absolute: match[1], path: match[2] || '/' }));

record(urls.length > 0, 'sitemap contains public URLs');
record(!sitemap.includes('<priority>'), 'sitemap omits ignored priority fields');
record(!sitemap.includes('/board'), 'sitemap excludes the editor');
record(!sitemap.includes('/download'), 'sitemap excludes redirects');

for (const url of urls) {
  const relative = url.path === '/' ? 'index.html' : `${url.path.replace(/^\//, '')}index.html`;
  const file = join(distDir, relative);
  let html = '';
  try {
    html = await readFile(file, 'utf8');
  } catch {
    record(false, `${url.path}: generated HTML exists`);
    continue;
  }

  const title = matches(html, /<title>[^<]+<\/title>/g);
  const description = matches(html, /<meta name="description" content="[^"]+" \/>/g);
  const canonical = matches(html, /<link rel="canonical" href="([^"]+)" \/>/g);
  const alternates = matches(html, /<link rel="alternate" hreflang="(en|pl|es|x-default)" href="[^"]+" \/>/g);
  const h1 = matches(html, /<h1(?:\s[^>]*)?>/g);
  const lang = url.path.startsWith('/pl/') ? 'pl' : url.path.startsWith('/es/') ? 'es' : 'en';

  record(title.length === 1, `${url.path}: exactly one title`);
  record(description.length === 1, `${url.path}: one meta description`);
  record(canonical.length === 1 && canonical[0].includes(`href="${url.absolute}"`), `${url.path}: self-canonical`);
  record(alternates.length === 4, `${url.path}: complete hreflang set`);
  record(h1.length === 1, `${url.path}: exactly one H1`);
  record(html.includes(`<html lang="${lang}">`), `${url.path}: matching document language`);
  record(!html.includes('<div id="root"></div>'), `${url.path}: content exists in raw HTML`);
  record(html.includes('https://tmcstudio.app/og-image.png'), `${url.path}: PNG social image`);
  if (title[0]) pageTitles.push(title[0]);
  if (description[0]) pageDescriptions.push(description[0]);
}

record(new Set(pageTitles).size === pageTitles.length, 'page titles are unique');
record(new Set(pageDescriptions).size === pageDescriptions.length, 'page descriptions are unique');

const spa = await readFile(join(distDir, 'spa.html'), 'utf8');
record(spa.includes('noindex,nofollow'), 'SPA shell is noindex');
record(spa.includes('<div id="root"></div>'), 'SPA shell remains client-rendered');

const notFound = await readFile(join(distDir, '404.html'), 'utf8');
record(notFound.includes('noindex,nofollow'), '404 document is noindex');

for (const check of checks) console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.label}`);

if (failures.length) {
  console.error(`\nSEO audit failed: ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(`\nSEO audit passed for ${urls.length} localized pages.`);
