import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://nexus24news.vercel.app';
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/?lang=hi`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/?lang=en`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
  ];
}
