/**
 * SEO Config — Central source of truth for SEO-related constants.
 *
 * All values are driven by the VITE_APP_BASE_URL environment variable.
 * To update after deployment, set VITE_APP_BASE_URL in your .env file
 * (e.g., https://bookmyhall.vercel.app) and rebuild. No code changes needed.
 *
 * When VITE_APP_BASE_URL is not set (during development), canonical and og:url
 * tags are simply omitted/empty — this is harmless for SEO during dev.
 */

/** Base URL of the deployed app. No trailing slash. */
export const BASE_URL: string = import.meta.env.VITE_APP_BASE_URL ?? '';

/** Default page title shown in browser tab and search results */
export const DEFAULT_TITLE = 'MITAOE Campus Resource Management | MIT Academy of Engineering';

/** Default meta description */
export const DEFAULT_DESCRIPTION =
  'AI-powered campus facility booking, canteen management, maintenance workflows, and analytics platform for MIT Academy of Engineering, Pune.';

/** Default Open Graph image (1200×630). Must be an absolute URL. */
export const DEFAULT_OG_IMAGE = BASE_URL ? `${BASE_URL}/og-preview.png` : '';

/** Site name shown in OG tags */
export const SITE_NAME = 'MITAOE Campus Resource Management';

/**
 * Build the canonical URL for a given path.
 * Returns empty string if BASE_URL is not configured yet.
 *
 * @example
 *   buildCanonical('/org/mitaoe/facilities')
 *   // → 'https://bookmyhall.vercel.app/org/mitaoe/facilities'
 */
export function buildCanonical(path: string): string {
  if (!BASE_URL) return '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}
