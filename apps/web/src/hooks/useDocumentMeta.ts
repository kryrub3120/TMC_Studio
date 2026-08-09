/**
 * useDocumentMeta — lightweight per-page document head management.
 *
 * Sets <title>, meta description, canonical and Open Graph / Twitter tags on
 * mount and whenever the title/description/path change (e.g. language switch).
 * No external dependency (no react-helmet). Static equivalents are emitted by
 * the prerender build; this hook keeps metadata correct after client navigation.
 */
import { useEffect } from 'react';
import { useTranslation } from '@tmc/ui';
import { getAlternates, localizePublicPath, SITE_URL, type PublicBasePath } from '../seo/publicSeo';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function useDocumentMeta(opts: { title: string; description: string; path?: string }) {
  const { title, description, path = '/' } = opts;
  const { language } = useTranslation();
  useEffect(() => {
    const localizedPath = localizePublicPath(path, language);
    const url = `${SITE_URL}${localizedPath}`;
    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setLink('canonical', url);

    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((node) => node.remove());
    for (const [hreflang, href] of getAlternates(path as PublicBasePath)) {
      const alternate = document.createElement('link');
      alternate.rel = 'alternate';
      alternate.hreflang = hreflang;
      alternate.href = href;
      document.head.appendChild(alternate);
    }
  }, [title, description, path, language]);
}
