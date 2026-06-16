/**
 * useDocumentMeta — lightweight per-page document head management.
 *
 * Sets <title>, meta description, canonical and Open Graph / Twitter tags on
 * mount and whenever the title/description/path change (e.g. language switch).
 * No external dependency (no react-helmet). For full multilingual SEO with
 * hreflang we would need prerendering or per-locale URLs — see
 * docs/SEO_PERFORMANCE_NOTES.md.
 */
import { useEffect } from 'react';

const BASE_URL = 'https://tmcstudio.app';

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
  useEffect(() => {
    const url = `${BASE_URL}${path}`;
    document.title = title;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setLink('canonical', url);
  }, [title, description, path]);
}
