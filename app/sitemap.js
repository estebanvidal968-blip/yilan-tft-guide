import { headers } from 'next/headers';
import { loadComps, loadTraits } from '@/lib/loadData';
import itemsTft from '@/data/tft/items.json';
import champs from '@/data/tft/champs.json';
import augments from '@/data/tft/augments.json';

// 动态生成：从请求头取真实域名，保证 sitemap 始终指向本站线上地址
// （而非构建机的 example.com 兜底），避免上线后搜索引擎抓到错误 URL。
export const dynamic = 'force-dynamic';

function baseUrl() {
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  if (host) {
    const proto = h.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
}

export default async function sitemap() {
  const base = baseUrl();
  const comps = (await loadComps()) || [];
  const traits = loadTraits() || [];

  const compUrls = comps.map((c) => ({
    url: `${base}/comp/${c.compId}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 140 件装备详情页（长尾 SEO：单件装备问答）
  const itemUrls = (itemsTft || []).map((it) => ({
    url: `${base}/item/${it.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // 31 个羁绊页（长尾 SEO：羁绊玩法 / 给谁带）
  const traitUrls = traits.map((t) => ({
    url: `${base}/trait/${encodeURIComponent(t.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // 66 个弈子出装页（长尾 SEO：弈子出什么装备）
  const champUrls = (champs || []).map((c) => ({
    url: `${base}/champion/${c.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // 283 个强化符文页（长尾 SEO：符文怎么用 / 几阶）
  const augUrls = (augments || []).map((a) => ({
    url: `${base}/augment/${a.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const staticUrls = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${base}/items`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/trait`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/champions`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/augments`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/tools/quiz`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/tools`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/tools/build-sim`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/tools/comp-gen`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/share`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];
  return [...staticUrls, ...compUrls, ...itemUrls, ...traitUrls, ...champUrls, ...augUrls];
}
