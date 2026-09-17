// 弈览 · SEO 主动推送（百度 + 必应）
// 比等爬虫爬 sitemap 快一个量级：主动推送 = 分钟级收录。
// 用法：
//   BAIDU_PUSH_TOKEN=xxx BING_API_KEY=yyy node scripts/push-seo.mjs        # 自适应配额推送（默认起始批 10）
//   BAIDU_PUSH_TOKEN=xxx node scripts/push-seo.mjs --all                   # 同上（保留兼容）
//   PUSH_BATCH=5 BAIDU_PUSH_TOKEN=xxx node scripts/push-seo.mjs            # 自定义起始批量
// 未设置 token/key 时自动跳过对应平台，仅做 sitemap 抓取与解析校验（安全 dry-run）。
//
// ⚠️ 关键约束（2026-09-16 实测）：百度主动推送按「整批」判定配额，
//    单批条数 > 当日 remain 时整批返回 {"error":400,"message":"over quota"}，一条都不收。
//    本站当前日配额 = 10 条。因此必须小批推送 + 遇 over quota 自动降批重试。
//    推送进度写入 data/push-seo-cursor.json，每日从断点继续，长期轮转覆盖全站。

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const SITE = 'https://yilangames.com';

// Windows 下从 HKCU\Environment 回退读取：WorkBuddy 沙箱/自动化拉起进程时
// 父进程的环境快照可能不含持久化后新增的变量，process.env 会为空。
function readEnvFromRegistry(name) {
  if (process.platform !== 'win32') return undefined;
  try {
    const out = execFileSync('reg', ['query', 'HKCU\\Environment', '/v', name], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    });
    const m = out.match(/REG_(?:SZ|EXPAND_SZ)\s+(.+)$/m);
    return m ? m[1].trim() : undefined;
  } catch {
    return undefined;
  }
}

function resolveEnv(name) {
  return process.env[name] || readEnvFromRegistry(name);
}

const BAIDU_TOKEN = resolveEnv('BAIDU_PUSH_TOKEN');
const BING_KEY = resolveEnv('BING_API_KEY');
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

// 推送队列排序：首页 → 攻略页（钱页）→ 其余页面。配合游标实现长期轮转覆盖。
function buildQueue(urls) {
  const uniq = [...new Set(urls)];
  const home = uniq.filter((u) => u === SITE || u === `${SITE}/`);
  const guides = uniq.filter((u) => !home.includes(u) && u.startsWith(`${SITE}/guides`));
  const rest = uniq.filter((u) => !home.includes(u) && !guides.includes(u));
  return [...home, ...guides, ...rest];
}

// 适配器：读/写推送断点，避免每天从头重复推同样的 URL
const CURSOR_PATH = new URL('../data/push-seo-cursor.json', import.meta.url);
function loadCursor() {
  try {
    return JSON.parse(readFileSync(CURSOR_PATH, 'utf8')) || {};
  } catch {
    return {};
  }
}
function saveCursor(offset) {
  try {
    writeFileSync(CURSOR_PATH, JSON.stringify({ offset, updatedAt: new Date().toISOString() }, null, 2));
  } catch (e) {
    console.warn('[baidu] 游标写入失败（不影响推送）:', e.message);
  }
}

async function pushOnce(urls) {
  const res = await fetch(`http://data.zz.baidu.com/urls?site=${SITE}&token=${BAIDU_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: urls.join('\n'),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  return await res.json().catch(() => ({ error: -1, message: `HTTP ${res.status}` }));
}

async function pushBaidu(queue) {
  if (!BAIDU_TOKEN) {
    console.log('[baidu] 未设置 BAIDU_PUSH_TOKEN，跳过。获取路径：百度资源平台(ziyuan.baidu.com) → 站点管理 → 数据推送 → 主动推送 → 复制 token');
    return;
  }
  const total = queue.length;
  let offset = ((Number(loadCursor().offset) || 0) % total + total) % total;
  let batch = Math.max(1, Number(process.env.PUSH_BATCH || 10));
  let success = 0;
  let remain = null;
  let guard = 0;

  while (guard++ < 60) {
    // 取从断点开始的一批（到末尾回绕）
    const slice = [];
    for (let i = 0; i < batch && i < total; i++) slice.push(queue[(offset + i) % total]);

    const data = await pushOnce(slice);

    if (data && typeof data.success === 'number') {
      success += data.success;
      remain = typeof data.remain === 'number' ? data.remain : remain;
      offset = (offset + slice.length) % total;
      saveCursor(offset);
      console.log(`[baidu] 批次 ${guard}: 推 ${slice.length} 条 -> success=${data.success} remain=${data.remain}`);
      if (remain === 0) {
        console.log('[baidu] 当日配额已用尽，停止。');
        break;
      }
      continue;
    }

    const msg = (data && data.message) || JSON.stringify(data);
    if (msg === 'over quota' && batch > 1) {
      batch = Math.max(1, Math.floor(batch / 2));
      console.log(`[baidu] over quota（本批 ${slice.length} 条超剩余配额）→ 降批至 ${batch} 重试`);
      continue;
    }
    console.log(`[baidu] 停止推送：${msg}`);
    break;
  }

  console.log(`[baidu] 本轮合计 success=${success}｜剩余配额=${remain ?? '未知'}｜队列 ${total} 条，断点 offset=${offset}`);
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
    const queue = buildQueue(all);
    console.log(`[baidu] 队列 ${queue.length} 条（首页 → 攻略页 → 其余），起始批 ${process.env.PUSH_BATCH || 10} 条，按当日配额自适应`);
    console.log('        队首:', queue.slice(0, 3).join(' | '));
    await pushBaidu(queue);
    console.log(`[bing] 将推送 ${all.length} 条（按 100/批）`);
    await pushBing(all);
    console.log('DONE');
  } catch (e) {
    console.error('ERROR', e.message || e);
    process.exit(1);
  }
})();
