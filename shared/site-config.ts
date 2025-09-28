export const DEFAULT_SITE_URL = "https://www.techinterviewnotes.com";

function removeTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function normalizeSiteUrl(url: string): string {
  const trimmed = url.trim();
  const withoutTrailingSlash = removeTrailingSlash(trimmed);
  return withoutTrailingSlash || DEFAULT_SITE_URL;
}

export function resolveSiteUrl(
  ...values: Array<string | undefined | null>
): string {
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }
    const normalized = removeTrailingSlash(trimmed);
    if (normalized) {
      return normalized;
    }
  }
  return DEFAULT_SITE_URL;
}

export function buildSiteUrl(baseUrl: string, path = ""): string {
  const normalizedBase = resolveSiteUrl(baseUrl);
  if (!path) {
    return normalizedBase;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
