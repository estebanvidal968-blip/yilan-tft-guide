import { headers } from 'next/headers';

// 动态生成：从请求头取真实域名，保证 sitemap 指向线上地址
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

export default function robots() {
  const base = baseUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 接口与内部统计页：无收录价值，抓取只会浪费配额
        disallow: ['/api/', '/stats'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}

// 说明：装备详情页（/item/*）**刻意不在 disallow 列表**。
// 它们已在页面 <meta name="robots" content="noindex, nofollow"> 声明不索引；
// 若在 robots.txt 里 disallow，爬虫抓不到页面就读不到 noindex，
// URL 会滞留在索引中（显示为无摘要），反而达不到移出索引的效果。
// 实测这批页面近 14 天总访问仅 567 次、单页 PV < 1 —— 允许抓取但禁止索引是当前最优解。
