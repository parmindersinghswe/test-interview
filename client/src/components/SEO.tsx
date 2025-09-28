import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
}

const SITE_URL = 'https://www.techinterviewnotes.com';

export function SEO({ title, description, url }: SEOProps) {
  const defaultTitle = 'DevInterview Pro - Master Your Tech Interview';
  const pageTitle = title ? `${title} | DevInterview Pro` : defaultTitle;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url ?? SITE_URL} />
    </Helmet>
  );
}
