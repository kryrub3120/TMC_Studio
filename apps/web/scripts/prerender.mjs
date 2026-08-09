import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(appDir, 'dist');
const ssrDir = join(appDir, 'dist-ssr');
const template = await readFile(join(distDir, 'index.html'), 'utf8');
const { render, getPrerenderManifest } = await import(
  pathToFileURL(join(ssrDir, 'entry-server.js')).href
);

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

function buildSeoHead(page) {
  const canonical = `https://tmcstudio.app${page.path}`;
  const locale = page.language === 'en' ? 'en_US' : page.language === 'pl' ? 'pl_PL' : 'es_ES';
  const alternates = page.alternates
    .map(([language, href]) => `<link rel="alternate" hreflang="${language}" href="${href}" />`)
    .join('\n    ');

  return `<!-- tmc-seo-start -->
    <meta name="robots" content="index,follow" />
    <meta name="description" content="${escapeHtml(page.description)}" />
    <title>${escapeHtml(page.title)}</title>
    <link rel="canonical" href="${canonical}" />
    ${alternates}
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:image" content="https://tmcstudio.app/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="TMC Studio" />
    <meta property="og:locale" content="${locale}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="https://tmcstudio.app/og-image.png" />
    <!-- tmc-seo-end -->`;
}

function withDocument(templateHtml, page, body) {
  return templateHtml
    .replace('<html lang="en">', `<html lang="${page.language}">`)
    .replace(/<!-- tmc-seo-start -->[\s\S]*?<!-- tmc-seo-end -->/, buildSeoHead(page))
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

const manifest = getPrerenderManifest();

// Keep a noindex shell for editor/auth routes before replacing the root document.
await writeFile(join(distDir, 'spa.html'), template);

for (const page of manifest) {
  const output = page.path === '/'
    ? join(distDir, 'index.html')
    : join(distDir, page.path.slice(1), 'index.html');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, withDocument(template, page, render(page.path, page.language)));
}

const notFoundBody = render('/__tmc-not-found__', 'en');
const notFound = template
  .replace(/<!-- tmc-seo-start -->[\s\S]*?<!-- tmc-seo-end -->/, `<!-- tmc-seo-start -->
    <meta name="robots" content="noindex,nofollow" />
    <title>Page not found | TMC Studio</title>
    <!-- tmc-seo-end -->`)
  .replace('<div id="root"></div>', `<div id="root">${notFoundBody}</div>`);
await writeFile(join(distDir, '404.html'), notFound);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${manifest.map((page) => `  <url>
    <loc>https://tmcstudio.app${page.path}</loc>
${page.alternates.map(([language, href]) => `    <xhtml:link rel="alternate" hreflang="${language}" href="${href}"/>`).join('\n')}
  </url>`).join('\n')}
</urlset>
`;
await writeFile(join(distDir, 'sitemap.xml'), sitemap);
await rm(ssrDir, { recursive: true, force: true });

console.log(`Prerendered ${manifest.length} localized public pages.`);
