import {
  DEFAULT_SITE_URL,
  buildSiteUrl as buildSiteUrlFromBase,
  resolveSiteUrl,
} from '@shared/site-config';

const siteUrl = resolveSiteUrl(
  typeof process !== 'undefined' ? (process.env?.SITE_URL as string | undefined) : undefined,
  import.meta.env?.SITE_URL as string | undefined,
  import.meta.env?.VITE_SITE_URL as string | undefined,
  DEFAULT_SITE_URL,
);

export const SITE_URL = siteUrl;

export function buildSiteUrl(path = ""): string {
  return buildSiteUrlFromBase(SITE_URL, path);
}

export const DEFAULT_IMAGE_URL = buildSiteUrl('/generated-icon.png');
