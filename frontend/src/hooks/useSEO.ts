import { useEffect } from 'react';
import {
  BASE_URL,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
} from '@/config/seo';

interface SEOProps {
  title?: string;
  description?: string;
  /** Full canonical URL. Use buildCanonical() from @/config/seo for convenience. */
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

function setMeta(name: string, content: string, property = false) {
  if (!content) return; // Don't set empty meta tags
  const attr = property ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  if (!href) return; // Skip if no domain configured yet
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * useSEO — sets page-level title and meta tags dynamically.
 *
 * All base URLs are read from VITE_APP_BASE_URL (via @/config/seo).
 * When VITE_APP_BASE_URL is not set (during development), canonical/og:url
 * tags are safely omitted — no broken URLs are injected.
 *
 * @example
 *   useSEO({
 *     title: 'Browse Facilities',
 *     description: 'Book seminar halls and labs...',
 *     canonical: buildCanonical(`/org/${orgId}/facilities`),
 *   });
 */
export function useSEO({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  noIndex = false,
}: SEOProps = {}) {
  useEffect(() => {
    const resolvedTitle = title ? `${title} | MITAOE` : DEFAULT_TITLE;
    const resolvedDescription = description || DEFAULT_DESCRIPTION;
    const resolvedOgTitle = ogTitle || resolvedTitle;
    const resolvedOgDescription = ogDescription || resolvedDescription;
    const resolvedOgImage = ogImage || DEFAULT_OG_IMAGE;
    // Canonical: use provided value, fall back to BASE_URL if on root, or skip if no domain
    const resolvedCanonical = canonical ?? BASE_URL;

    // Document title
    document.title = resolvedTitle;

    // Primary meta
    setMeta('description', resolvedDescription);
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    setMeta('og:type', ogType, true);
    setMeta('og:title', resolvedOgTitle, true);
    setMeta('og:description', resolvedOgDescription, true);
    setMeta('og:image', resolvedOgImage, true);
    setMeta('og:url', resolvedCanonical, true);

    // Twitter Card
    setMeta('twitter:title', resolvedOgTitle);
    setMeta('twitter:description', resolvedOgDescription);
    setMeta('twitter:image', resolvedOgImage);

    // Canonical link tag
    setCanonical(resolvedCanonical);
  }, [title, description, canonical, ogTitle, ogDescription, ogImage, ogType, noIndex]);
}

export default useSEO;
