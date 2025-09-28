import { Helmet } from 'react-helmet-async';
import { DEFAULT_IMAGE_URL, SITE_URL } from '@/lib/site';

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
  schema?: Record<string, unknown>;
}

export function SEO({
  title,
  description,
  url,
  image = DEFAULT_IMAGE_URL,
  type = 'website',
  schema,
}: SEOProps) {
  const defaultTitle = 'DevInterview Pro - Master Your Tech Interview';
  const pageTitle = title ? `${title} | DevInterview Pro` : defaultTitle;
  const pageUrl = url ?? SITE_URL;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={pageUrl} />
      {type && <meta property="og:type" content={type} />}
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
}
