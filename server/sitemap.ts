import { storage } from './storage.js';
import { env } from './config.js';
import { buildSiteUrl } from '../shared/site-config.js';
import { InMemoryCache } from './cache.js';

const staticPaths = [
  '/',
  '/materials',
  '/about',
  '/contact',
  '/help',
  '/terms',
  '/privacy',
  '/refund',
];

const SITEMAP_CACHE_KEY = 'sitemap';

const secondsToMilliseconds = (seconds: number): number => Math.max(1, Math.floor(seconds * 1000));

const sitemapCache = new InMemoryCache<string>(
  secondsToMilliseconds(env.SITEMAP_CACHE_TTL_SECONDS),
);

export function invalidateSitemapCache(): void {
  sitemapCache.delete(SITEMAP_CACHE_KEY);
}

export async function generateSitemap(): Promise<string> {
  const cachedSitemap = sitemapCache.get(SITEMAP_CACHE_KEY);
  if (cachedSitemap) {
    return cachedSitemap;
  }

  const materials = await storage.getAllMaterials();
  const materialPaths = materials.map((m) => `/materials/${m.id}`);
  const baseUrl = env.SITE_URL;
  const allUrls = [
    ...staticPaths.map((path) => buildSiteUrl(baseUrl, path)),
    ...materialPaths.map((path) => buildSiteUrl(baseUrl, path)),
  ];
  const urls = allUrls
    .map((absoluteUrl) => `  <url><loc>${absoluteUrl}</loc></url>`)
    .join('\n');
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  sitemapCache.set(SITEMAP_CACHE_KEY, sitemapXml);

  return sitemapXml;
}
