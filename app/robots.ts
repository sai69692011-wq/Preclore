import type { MetadataRoute } from 'next';

const siteUrl = 'https://preclore.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth',
          '/connections',
          '/profile',
          '/submit',
          '/project/new',
          '/reveal'
        ]
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
