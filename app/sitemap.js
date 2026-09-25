import { headers } from 'next/headers';
import { loadComps, loadTraits } from '@/lib/loadData';
import { guides } from '@/content/guides';
import { comps as legendComps } from '@/legends/data/comps';
import { runes as legendRunes } from '@/legends/data/runes';
import { LEGENDS_LIVE } from '@/lib/legendsLive';
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

  // 28 篇 S18 核心攻略页（站点主内容，最高优先级长尾入口）
  const guideUrls = (guides || []).map((g) => ({
    url: `${base}/guides/${g.slug}`,
    lastModified: g.updatedAt ? new Date(g.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  // 英雄联盟传奇 · 海克斯典籍（新板块，优先让搜索引擎收录）
  // 开关关闭时不输出任何 /legends URL，避免搜索引擎抓到 404。
  const legendStaticUrls = LEGENDS_LIVE
    ? [
        { url: `${base}/legends`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: `${base}/legends/keys`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
        { url: `${base}/legends/comps`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: `${base}/legends/runes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
        { url: `${base}/legends/items`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
      ]
    : [];
  const legendCompUrls = LEGENDS_LIVE
    ? (legendComps || []).map((c) => ({
        url: `${base}/legends/comps/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      }))
    : [];
  const legendRuneUrls = LEGENDS_LIVE
    ? (legendRunes || []).map((r) => ({
        url: `${base}/legends/runes/${r.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      }))
    : [];

  const staticUrls = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/guides`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
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
  return [
    ...staticUrls,
    ...guideUrls,
    ...legendStaticUrls,
    ...legendCompUrls,
    ...legendRuneUrls,
    ...compUrls,
    ...itemUrls,
    ...traitUrls,
    ...champUrls,
    ...augUrls,
  ];
}
