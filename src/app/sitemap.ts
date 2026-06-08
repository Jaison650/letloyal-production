import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://pilot.letloyal.com',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://pilot.letloyal.com/privacy-policy',
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: 'https://pilot.letloyal.com/terms-of-service',
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
  // NOTE: Do NOT include /admin, /merchant/*, /my-rewards, /api/*
}
