import { loadComps } from '@/lib/loadData';

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const comps = (await loadComps()) || [];
  const compUrls = comps.map((c) => ({
    url: `${base}/comp/${c.compId}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
  const staticUrls = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];
  return [...staticUrls, ...compUrls];
}
