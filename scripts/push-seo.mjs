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
//    推送进度写入 data/push-seo-cursor.json —— 记录「已推 URL 集合」而非数字下标：
//    sitemap 增删不会让进度漂移，杜绝重复推 / 漏推；全站推完一轮自动重置，长期轮转覆盖。

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

// 优先插队队列：data/push-seo-priority.json 里的 URL 会被插到「当前断点」位置，
// 使下一次推送优先包含它们（新上线页面用，不必等环形队列慢慢轮到）。
// 推送成功后可从该文件移除；留空数组即关闭插队。
const PRIORITY_PATH = new URL('../data/push-seo-priority.json', import.meta.url);
function loadPriority() {
  try {
    const arr = JSON.parse(readFileSync(PRIORITY_PATH, 'utf8'));
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}

// 待推列表 = 全站队列里「尚未推过」的 URL，优先 URL 排最前。
// ⚠️ 用「已推集合」而非数字下标当游标：sitemap 增删不会让进度漂移。
// （旧实现用 offset 下标，队列长度一变，同一个 offset 就指向了不同 URL → 重复推/漏推）
function buildPending(queue, pushed) {
  const pending = queue.filter((u) => !pushed[u]);
  const pri = loadPriority().filter((u) => pending.includes(u));
  if (!pri.length) return pending;
  return [...pri, ...pending.filter((u) => !pri.includes(u))];
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
// 百度配额按「北京时间自然日」重置，必须用 Asia/Shanghai 日期做幂等判定。
// 若用 UTC 日期：北京时间 00:00-08:00 之间跑的会被记成前一天，
// 当天 08:00 之后再跑就会误判为新一日，白打 4 次降批请求。
function bjToday() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }); // YYYY-MM-DD
}

// pushed: { "<url>": "推送日期" } —— 记录每条 URL 的推送日，既做游标也留档
function saveCursor(pushed, successCount = 0) {
  try {
    const prev = loadCursor();
    // 仅在真正推送成功时更新「上次成功日期」，用于同日复跑的幂等短路（FORCE_PUSH=1 可绕过）
    const okDate = successCount > 0 ? bjToday() : prev.lastSuccessDate;
    writeFileSync(
      CURSOR_PATH,
      JSON.stringify({ pushed, updatedAt: new Date().toISOString(), lastSuccessDate: okDate }, null, 2)
    );
  } catch (e) {
    console.warn('[baidu] 游标写入失败（不影响推送）:', e.message);
  }
}

// 旧格式（数字 offset）→ 新格式（已推集合）迁移：把队列前 N 条视为已推，保持进度不倒退。
// ⚠️ 必须跳过 priority 里的 URL —— 否则新上线页面若恰好落在前 N 条内，会被误标成「已推」，
//    插队直接失效（实测踩过：/arts 正好排在 150 以内）。
function migrateCursor(cursor, queue) {
  if (cursor && cursor.pushed && typeof cursor.pushed === 'object') {
    return { pushed: cursor.pushed, migrated: false };
  }
  const n = Math.min(Math.max(Number(cursor?.offset) || 0, 0), queue.length);
  const pri = new Set(loadPriority());
  const pushed = {};
  for (let i = 0; i < n; i++) {
    if (!pri.has(queue[i])) pushed[queue[i]] = 'migrated';
  }
  return { pushed, migrated: n > 0 };
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
  const cursor = loadCursor();
  const today = bjToday();
  // 同日已成功推送过 → 直接短路，避免无意义的 4 次降批请求（配额按日发放，同日重跑必 over quota）
  if (cursor.lastSuccessDate === today && !process.env.FORCE_PUSH) {
    console.log(`[baidu] 今日（${today}）已成功推送过，跳过本轮（同日配额已用尽，重复调用无收益）。设 FORCE_PUSH=1 可强制重跑。`);
    const { pushed: p } = migrateCursor(cursor, queue);
    console.log(`[baidu] 本轮合计 success=0｜剩余配额=0（当日已用尽）｜全站 ${total} 条，已推 ${Object.keys(p).length} 条`);
    return;
  }
  // 游标：已推 URL 集合（旧格式自动迁移，进度不倒退）
  let { pushed, migrated } = migrateCursor(cursor, queue);
  if (migrated) {
    console.log(`[baidu] 游标迁移（旧 offset → 已推集合）：${Object.keys(pushed).length} 条视为已推`);
    saveCursor(pushed, 0);
  }
  let batch = Math.max(1, Number(process.env.PUSH_BATCH || 10));
  let success = 0;
  let remain = null;
  let guard = 0;

  while (guard++ < 60) {
    let pending = buildPending(queue, pushed);
    // 全站推完一轮 → 清空记录，开启下一轮（保持长期轮转语义）
    if (!pending.length) {
      console.log('[baidu] 全站已推完一轮，重置记录开始新一轮');
      pushed = {};
      pending = buildPending(queue, pushed);
    }
    const slice = pending.slice(0, batch);

    const data = await pushOnce(slice);

    if (data && typeof data.success === 'number') {
      success += data.success;
      remain = typeof data.remain === 'number' ? data.remain : remain;
      // 百度按「整批」判定配额：要么整批收下，要么整批 over quota。
      // 因此仅在本批全部成功时标记已推，绝不把没推成的 URL 记成已推。
      if (data.success === slice.length) {
        const t = bjToday();
        slice.forEach((u) => {
          pushed[u] = t;
        });
      } else if (data.success > 0) {
        console.log(`[baidu] 本批部分成功 ${data.success}/${slice.length}，不标记，下轮重试`);
      }
      saveCursor(pushed, data.success);
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

  console.log(
    `[baidu] 本轮合计 success=${success}｜剩余配额=${remain ?? '未知'}｜全站 ${total} 条，已推 ${Object.keys(pushed).length} 条`
  );
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
