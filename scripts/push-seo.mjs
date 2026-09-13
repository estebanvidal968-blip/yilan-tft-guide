// 弈览 · SEO 主动推送（百度 + 必应）
// 比等爬虫爬 sitemap 快一个量级：主动推送 = 分钟级收录。
// 用法：
//   BAIDU_PUSH_TOKEN=xxx BING_API_KEY=yyy node scripts/push-seo.mjs        # 默认推首页+28篇攻略（优先，省配额）
//   BAIDU_PUSH_TOKEN=xxx node scripts/push-seo.mjs --all                   # 全量推送所有 URL
// 未设置 token/key 时自动跳过对应平台，仅做 sitemap 抓取与解析校验（安全 dry-run）。

const SITE = 'https://yilangames.com';
const BAIDU_TOKEN = process.env.BAIDU_PUSH_TOKEN;
const BING_KEY = process.env.BING_API_KEY;
const PUSH_ALL = process.argv.includes('--all');
const TIMEOUT = 20000;

async function getSitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`sitemap 抓取失败: ${res.status}`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter(Boolean);
  if (locs.length === 0) throw new Error('sitemap 未解析到任何 <loc>');
  return locs;
}

// 主动推送优先集：首页 + 全部攻略页（钱页，配额宝贵）
function prioritySet(urls) {
  const p = urls.filter((u) => u === SITE || u.startsWith(`${SITE}/guides`));
  if (!p.includes(SITE)) p.unshift(SITE);
  return p;
}

async function pushBaidu(urls) {
  if (!BAIDU_TOKEN) {
    console.log('[baidu] 未设置 BAIDU_PUSH_TOKEN，跳过。获取路径：百度资源平台(ziyuan.baidu.com) → 站点管理 → 数据推送 → 主动推送 → 复制 token');
    return;
  }
  const body = urls.join('\n');
  const res = await fetch(`http://data.zz.baidu.com/urls?site=${SITE}&token=${BAIDU_PUSH_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body,
    signal: AbortSignal.timeout(TIMEOUT),
  });
  const data = await res.json().catch(() => ({}));
  console.log('[baidu] 推送', urls.length, '条 ->', JSON.stringify(data));
}

async function pushBing(urls) {
  if (!BING_KEY) {
    console.log('[bing] 未设置 BING_API_KEY，跳过。获取路径：Bing Webmaster Tools → 设置 → API 访问，生成 key');
    return;
  }
  // 必应单批上限 100 条
  for (let i = 0; i < urls.length; i += 100) {
    const batch = urls.slice(i, i + 100);
    const res = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch?apikey=${BING_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteUrl: SITE, urlList: batch }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const data = await res.json().catch(() => ({}));
    console.log(`[bing] 批次 ${Math.floor(i / 100) + 1} (${batch.length} 条) ->`, JSON.stringify(data));
  }
}

(async () => {
  try {
    const all = await getSitemapUrls();
    console.log(`[sitemap] 共解析 ${all.length} 条 URL`);
    const baiduUrls = PUSH_ALL ? all : prioritySet(all);
    console.log(`[baidu] 将推送 ${baiduUrls.length} 条（${PUSH_ALL ? '全量' : '优先级：首页 + /guides 攻略'}）`);
    console.log('        示例:', baiduUrls.slice(0, 3).join(' | '));
    await pushBaidu(baiduUrls);
    console.log(`[bing] 将推送 ${all.length} 条（按 100/批）`);
    await pushBing(all);
    console.log('DONE');
  } catch (e) {
    console.error('ERROR', e.message || e);
    process.exit(1);
  }
})();
