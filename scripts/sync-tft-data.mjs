#!/usr/bin/env node
// 全量抓取 OP.GG TFT 数据并聚合为站点可直接消费的静态 JSON。
//
//   node scripts/sync-tft-data.mjs [--concurrency 6] [--min-sample 400] [--skip-champs]
//
// 产出（data/tft/）：
//   items.json     装备元数据 + 「谁出这件装最赚」适配榜
//   champs.json    弈子出装胜率榜 + 基线
//   augments.json  283 条强化符文元数据
//   meta.json      生成时间、样本量、待校正名单
//
// 数据源全部来自 OP.GG 官方 MCP（免鉴权），无任何 LLM 参与。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'data', 'tft');
const MCP_URL = 'https://mcp-api.op.gg/mcp';
const DDRAGON = 'https://ddragon.leagueoflegends.com/cdn/16.17.1';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
};
const CONCURRENCY = Number(arg('concurrency', 6));
const MIN_SAMPLE = Number(arg('min-sample', 400));
const SKIP_CHAMPS = process.argv.includes('--skip-champs');

// ---------------------------------------------------------------- MCP 客户端

class McpClient {
  constructor() {
    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };
  }

  // 注意：initialize / notifications 可能返回空体或 SSE（data: 前缀），
  // 只有 tools/call 一定是纯 JSON。这里统一容错解析。
  async post(body) {
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    const sid = res.headers.get('mcp-session-id');
    if (sid) this.headers['mcp-session-id'] = sid;
    const text = (await res.text()).trim();
    if (!text) return null;
    const lines = text.split(/\r?\n/).filter((l) => l.startsWith('data:'));
    const payload = lines.length ? lines[lines.length - 1].slice(5).trim() : text;
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }

  async init() {
    await this.post({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: {
        protocolVersion: '2024-11-05', capabilities: {},
        clientInfo: { name: 'yilan-tft-sync', version: '1.0' },
      },
    });
    await this.post({ jsonrpc: '2.0', method: 'notifications/initialized' });
  }

  async toolList() {
    const j = await this.post({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    return j.result?.tools || [];
  }

  async call(name, args = {}, attempt = 1) {
    const j = await this.post({
      jsonrpc: '2.0', id: Date.now() + attempt,
      method: 'tools/call', params: { name, arguments: args },
    });
    const text = j?.result?.content?.[0]?.text;
    if (!text) {
      if (attempt < 3) {
        await sleep(800 * attempt);
        return this.call(name, args, attempt + 1);
      }
      throw new Error(`工具 ${name} 返回为空: ${JSON.stringify(j?.error || j).slice(0, 200)}`);
    }
    return JSON.parse(text);
  }

  // 该工具返回 {headers, rows, header_description} 类表格结构
  async table(name, args = {}) {
    const r = await this.call(name, args);
    const idx = Object.fromEntries((r.headers || []).map((h, i) => [h, i]));
    return (r.rows || []).map((row) =>
      Object.fromEntries(Object.entries(idx).map(([k, i]) => [k, row[i]]))
    );
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mapLimit(items, limit, worker) {
  const out = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return out;
}

// ------------------------------------------------------- 名称解析（弈子）

// TFT 独占单位：Data Dragon 没有，必须手工映射。
const MANUAL_UNITS = {
  Kobuko: '可酷伯',
  Yunara: '芸阿娜',
  Alune: '阿露恩',
  Cinderling: '驻灵',
  Sentry: '苍蓝雕纹魔像',
  Sentinel: '锋喙鸟',
  Krug: '石甲虫',
  Brambleback: '石甲虫',
  Murkwolf: '暗影狼',
  Gromp: '魔沼蛙',
  Scuttlecrab: '迅捷蟹',
  CrimsonRaptor: '绯红印记树怪',
  ElderDragon: '远古巨龙',
  SprykinSummon: '灵狐召唤物',
};

// 形态后缀 —— 不该被当成名字的一部分，也不该生成独立弈子（Lux 除外）。
const FORM_TOKENS = new Set([
  'AD', 'AP', 'Small', 'Big', 'Large', 'Spider', 'Cougar', 'Melee', 'Ranged',
  'Base', 'Coven', 'Fae', 'Primal', 'Moonbeam', 'Sunbeam', 'Inferno',
  'Elderwood', 'Blackthorn', 'Blossom', 'Summon', 'Unique', 'Trait',
]);

// Data Dragon 的 id 拼写与 OP.GG key 不完全一致（Leblanc vs LeBlanc、Khazix vs KhaZix），
// 统一按小写做键匹配，同时保留原拼写用于拼头像 URL（ddragon 文件名大小写敏感）。
const UNIT_INDEX = new Map(); // 小写英文名 -> { cn, id }
let knownNames = [];          // 小写英文名，按长度降序，用于最长前缀匹配

async function loadDdragon() {
  let count = 0;
  try {
    const res = await fetch(`${DDRAGON}/data/zh_CN/champion.json`);
    const j = await res.json();
    for (const c of Object.values(j.data || {})) {
      UNIT_INDEX.set(c.id.toLowerCase(), { cn: c.name, id: c.id });
      count += 1;
    }
  } catch (e) {
    console.warn('[warn] Data Dragon 中文名拉取失败，将只用手工映射：', e.message);
  }
  for (const [id, cn] of Object.entries(MANUAL_UNITS)) {
    UNIT_INDEX.set(id.toLowerCase(), { cn, id, manual: true });
  }
  knownNames = [...UNIT_INDEX.keys()].sort((a, b) => b.length - a.length);
  return count;
}

// 从 OP.GG key 拆出 { name, form }。例：DA_18_MasterYi_AD -> {name:'MasterYi', form:'AD'}
function splitUnitKey(key) {
  const s = String(key)
    .replace(/^DA_/, '')
    .replace(/^TFT/, '')
    .replace(/_/g, '')
    .replace(/\d+/g, ''); // 去掉 18 这类赛季编号
  if (!s) return { name: '', form: '' };

  const lower = s.toLowerCase();
  const hit = knownNames.find((k) => lower.startsWith(k));
  if (!hit) return { name: s, form: '' };
  return { name: hit, form: s.slice(hit.length) || '' };
}

function unitName(key) {
  const { name, form } = splitUnitKey(key);
  const rec = UNIT_INDEX.get(String(name).toLowerCase());
  if (!rec) return name || String(key);
  // 拉克丝各形态是商店里彼此独立的单位，保留形态后缀
  if (name === 'lux' && form) return `${rec.cn}·${form}`;
  return rec.cn;
}

function slugOf(key) {
  const { name, form } = splitUnitKey(key);
  const base = (name || String(key)).toLowerCase();
  // 拉克丝按形态独立成条；其余弈子的 AD/AP/Spider 等形态合并为同一单位
  const suffix = name === 'Lux' && form ? `-${form.toLowerCase()}` : '';
  return `${base}${suffix}`.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const iconFor = (key) => {
  const { name } = splitUnitKey(key);
  const rec = UNIT_INDEX.get(String(name).toLowerCase());
  if (!rec || rec.manual) return ''; // TFT 独占单位无 Data Dragon 头像
  return `${DDRAGON}/img/champion/${rec.id}.png`;
};

// ------------------------------------------------------- 名称解析（装备）

const slugOfItem = (key) =>
  String(key).replace(/^DA_/, '').replace(/^18_/, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function itemKind(key) {
  if (/_Radiant$/.test(key)) return '光明版';
  if (key.startsWith('DA_Component_') || key.startsWith('DA_Component')) return '散件';
  if (key.startsWith('DA_Artifact_')) return '神器';
  if (key.includes('Emblem')) return '纹章';
  if (/Potion/.test(key)) return '消耗品';
  if (key.startsWith('DA_Tacticians')) return '金铲铲';
  return '成装';
}

const cleanDesc = (s) =>
  String(s || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<rules>[\s\S]*?<\/rules>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/%i:[^%]+%/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// ---------------------------------------------------------------- 主流程

async function main() {
  const t0 = Date.now();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('[1/6] 载入 Data Dragon 中文名…');
  const ddCount = await loadDdragon();
  console.log(`      英文名表 ${knownNames.length} 条（Data Dragon ${ddCount} + 手工 ${Object.keys(MANUAL_UNITS).length}）`);

  const mcp = new McpClient();
  await mcp.init();

  console.log('[2/6] 读取工具 schema，取弈子白名单…');
  const tools = await mcp.toolList();
  const schema = (n) => tools.find((t) => t.name === n)?.inputSchema || {};
  const champIds = schema('tft_get_champion_item_build').properties?.champion_id?.enum || [];
  console.log(`      弈子 ${champIds.length} 个`);

  console.log('[3/6] 抓取装备元数据…');
  // 注意：该工具返回 {data:[...]}，与 augments 的 {headers,rows} 表格结构不同。
  // 同一件装备会同时出现 DA_ 前缀与无前缀两种 key（如 DA_AdaptiveHelm / AdaptiveHelm），
  // 而出装记录里用的是带前缀的写法，因此必须建别名索引，否则会全部查不中。
  const icRes = await mcp.call('tft_list_item_combinations', { lang: 'zh_CN' });
  const itemRows = icRes.data || icRes.rows || [];
  const itemMeta = new Map();   // 规范 key -> 装备记录
  const itemAlias = new Map();  // 任意 key 写法 -> 装备记录
  for (const r of itemRows) {
    const org = r.org || {};
    const key = r.ingameKey || org.key;
    if (!key) continue;
    const rec = {
      id: slugOfItem(key),
      key,
      name: r.name || org.name || key,
      desc: cleanDesc(r.desc || org.desc),
      icon: r.imageUrl || org.imageUrl || '',
      kind: itemKind(key),
    };
    itemMeta.set(key, rec);
    for (const k of [key, org.key, r.apiName]) {
      if (!k) continue;
      const bare = k.replace(/^DA_/, '');
      itemAlias.set(k, rec);
      itemAlias.set(bare, rec);
      itemAlias.set(`DA_${bare}`, rec);
      itemAlias.set(k.toLowerCase().replace(/[^a-z0-9]/g, ''), rec);
    }
  }
  console.log(`      装备 ${itemMeta.size} 件（别名 ${itemAlias.size} 条）`);

  console.log('[4/6] 抓取强化符文…');
  const augRows = await mcp.table('tft_list_augments', { lang: 'zh_CN' });
  const TIER_CN = { silver: '银', gold: '金', prismatic: '棱彩' };
  const augments = augRows.map((r) => ({
    id: slugOfItem(r.apiName || r.name),
    key: r.apiName || '',
    name: r.name || '',
    desc: cleanDesc(r.desc),
    tier: TIER_CN[r.tier] || r.tier || '',
    tierKey: r.tier || '',
    icon: r.imageUrl || '',
  })).filter((a) => a.name);
  console.log(`      符文 ${augments.length} 条`);

  console.log('[5/6] 抓取弈子费用（从阵容榜反查）…');
  const costMap = new Map();
  try {
    const decks = await mcp.call('tft_list_meta_decks', { lang: 'zh_CN', limit: 60 });
    for (const d of decks.data || []) {
      for (const u of d.units || []) {
        if (u?.key && typeof u.tier === 'number' && !costMap.has(u.key)) {
          costMap.set(u.key, u.tier);
        }
      }
    }
  } catch (e) {
    console.warn('[warn] 阵容榜抓取失败，费用将缺失：', e.message);
  }
  console.log(`      费用覆盖 ${costMap.size} 个`);

  // ---- 弈子出装：全量抓取 + 聚合
  const champs = new Map();   // slug -> 聚合态
  const pairs = new Map();    // `${champSlug}|${itemSlug}` -> 聚合态
  let globalBuilds = [];
  let totalSamples = 0;

  if (!SKIP_CHAMPS) {
    console.log(`[6/6] 抓取 ${champs.size || champIds.length} 个弈子的出装统计（并发 ${CONCURRENCY}）…`);
    let done = 0;
    await mapLimit(champIds, CONCURRENCY, async (cid) => {
      let rows = [];
      try {
        const r = await mcp.call('tft_get_champion_item_build', { champion_id: cid });
        rows = r.data || [];
      } catch (e) {
        console.warn(`      [warn] ${cid} 抓取失败：${e.message}`);
        return;
      }
      const slug = slugOf(cid);
      const name = unitName(cid);

      if (!champs.has(slug)) {
        champs.set(slug, {
          id: slug, key: cid, name, icon: iconFor(cid),
          cost: costMap.get(cid) || null,
          keys: [], builds: [],
          _w: 0, _wp: 0, // 加权样本量 / 加权名次和
        });
      }
      const c = champs.get(slug);
      if (!c.keys.includes(cid)) c.keys.push(cid);
      if (!c.cost && costMap.get(cid)) c.cost = costMap.get(cid);

      for (const b of rows) {
        const n = Number(b.itemCount) || 0;
        if (n <= 0) continue;
        const ap = Number(b.avgPlacement);
        if (!Number.isFinite(ap)) continue;

        totalSamples += n;
        c._w += n;
        c._wp += n * ap;

        const items = (b.itemNames || []).map((k) => itemMeta.get(k)?.id).filter(Boolean);
        if (items.length < 2) continue; // 单件记录不进「最佳三件套」
        const rec = {
          items,
          itemNames: (b.itemNames || []).map((k) => itemMeta.get(k)?.name || k),
          itemIcons: (b.itemNames || []).map((k) => itemMeta.get(k)?.icon || ''),
          n, ap,
          winRate: Number(b.winRate) || 0,
          top4Rate: Number(b.top4Rate) || 0,
        };
        c.builds.push(rec);

        // (弈子, 装备) 配对聚合
        for (const it of new Set(items)) {
          const pk = `${slug}|${it}`;
          if (!pairs.has(pk)) pairs.set(pk, { champ: slug, item: it, n: 0, wp: 0, wr: 0, t4: 0 });
          const p = pairs.get(pk);
          p.n += n; p.wp += n * ap;
          p.wr += n * (Number(b.winRate) || 0);
          p.t4 += n * (Number(b.top4Rate) || 0);
        }
      }
      done += 1;
      if (done % 10 === 0) process.stdout.write(`      ${done}/${champIds.length}\r`);
    });
    console.log(`      ${done}/${champIds.length} 完成，样本合计 ${totalSamples.toLocaleString()} 场`);
  }

  // ---- 计算基线 -> Δ
  console.log('      计算基线与增益…');
  const champList = [];
  for (const c of champs.values()) {
    const baseline = c._w ? c._wp / c._w : 0;
    const builds = c.builds
      .map((b) => ({ ...b, delta: +(baseline - b.ap).toFixed(3) }))
      .sort((a, b2) => b2.delta - a.delta || b2.n - a.n);
    champList.push({
      id: c.id, key: c.key, keys: c.keys, name: c.name, icon: c.icon, cost: c.cost,
      baseline: +baseline.toFixed(3),
      sampleCount: c._w,
      topBuilds: builds.slice(0, 12),
      worstBuilds: builds.slice(-3).reverse(),
      buildCount: c.builds.length,
    });
  }
  champList.sort((a, b2) => (a.cost || 99) - (b2.cost || 99) || b2.sampleCount - a.sampleCount);

  // (弈子, 装备) Δ
  const pairList = [];
  for (const p of pairs.values()) {
    const c = champs.get(p.champ);
    if (!c) continue;
    const baseline = c._w ? c._wp / c._w : 0;
    const ap = p.n ? p.wp / p.n : 0;
    pairList.push({
      champ: p.champ, item: p.item,
      delta: +(baseline - ap).toFixed(3),
      avgPlacement: +ap.toFixed(3),
      n: p.n,
      winRate: p.n ? +(p.wr / p.n).toFixed(4) : 0,
      top4Rate: p.n ? +(p.t4 / p.n).toFixed(4) : 0,
    });
  }

  // 装备侧：Top 适配弈子
  const byItem = new Map();
  for (const p of pairList) {
    if (p.n < MIN_SAMPLE) continue;
    if (!byItem.has(p.item)) byItem.set(p.item, []);
    byItem.get(p.item).push(p);
  }
  const itemList = [];
  for (const meta of itemMeta.values()) {
    const best = (byItem.get(meta.id) || []).slice().sort((a, b2) => b2.delta - a.delta).slice(0, 10);
    const n = best.reduce((s, x) => s + x.n, 0);
    const wp = best.reduce((s, x) => s + x.n * x.avgPlacement, 0);
    itemList.push({
      ...meta,
      sampleCount: n,
      avgPlacement: n ? +(wp / n).toFixed(3) : 0,
      best: best.map((p) => ({
        champ: p.champ,
        champName: champs.get(p.champ)?.name || p.champ,
        champIcon: champs.get(p.champ)?.icon || '',
        delta: p.delta, avgPlacement: p.avgPlacement,
        winRate: p.winRate, top4Rate: p.top4Rate, n: p.n,
      })),
    });
  }
  // 有对局数据的排前面，再按样本量降序
  itemList.sort((a, b2) => (b2.sampleCount ? 1 : 0) - (a.sampleCount ? 1 : 0) || b2.sampleCount - a.sampleCount);

  // 奇效组合：全站 Δ 最高的出装（样本量门槛）
  globalBuilds = champList
    .flatMap((c) => c.topBuilds.map((b) => ({ ...b, champ: c.id, champName: c.name, champIcon: c.icon, cost: c.cost })))
    .filter((b) => b.n >= MIN_SAMPLE * 2)
    .sort((a, b2) => b2.delta - a.delta)
    .slice(0, 30);

  // 待校正名单：没能解析出中文名的
  const unresolved = [...new Set(
    champIds.map(splitUnitKey)
      .filter(({ name }) => !UNIT_INDEX.has(String(name).toLowerCase()))
      .map(({ name }) => name)
  )];

  // ---- 落盘
  const meta = {
    generatedAt: new Date().toISOString(),
    source: 'OP.GG TFT MCP + Data Dragon 16.17.1',
    patch: 'S18 自然之力',
    counts: {
      items: itemList.length,
      itemsWithData: itemList.filter((i) => i.sampleCount > 0).length,
      champs: champList.length,
      augments: augments.length,
      pairs: pairList.length,
    },
    totalSamples,
    minSample: MIN_SAMPLE,
    unresolvedNames: unresolved,
  };

  fs.writeFileSync(path.join(OUT_DIR, 'items.json'), JSON.stringify(itemList, null, 1));
  fs.writeFileSync(path.join(OUT_DIR, 'champs.json'), JSON.stringify(champList, null, 1));
  fs.writeFileSync(path.join(OUT_DIR, 'augments.json'), JSON.stringify(augments, null, 1));
  fs.writeFileSync(path.join(OUT_DIR, 'top-builds.json'), JSON.stringify(globalBuilds, null, 1));
  fs.writeFileSync(path.join(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2));

  console.log('\n完成：');
  console.log(`  装备 ${meta.counts.items} 件（有对局数据 ${meta.counts.itemsWithData} 件）`);
  console.log(`  弈子 ${meta.counts.champs} 个，出装样本 ${totalSamples.toLocaleString()} 场`);
  console.log(`  符文 ${meta.counts.augments} 条，奇效组合 ${globalBuilds.length} 组`);
  console.log(`  待校正弈子名：${unresolved.length ? unresolved.join(', ') : '无'}`);
  console.log(`  耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s → ${OUT_DIR}`);
}

main().catch((e) => {
  console.error('[fatal]', e);
  process.exit(1);
});
