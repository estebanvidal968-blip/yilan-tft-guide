// 服务端数据读取层（仅用于 Server Component / API 路由，绝不进前端包）。
// 优先读取同步脚本生成的 data/*.opgg.json（OP.GG 实时数据），
// 若不存在则回退到手工种子 data/*.json，保证未跑同步时站点仍可正常展示。
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');

function readPreferred(base) {
  const opgg = path.join(DATA_DIR, `${base}.opgg.json`);
  const orig = path.join(DATA_DIR, `${base}.json`);
  try {
    if (fs.existsSync(opgg)) {
      return JSON.parse(fs.readFileSync(opgg, 'utf8'));
    }
  } catch (e) {
    console.warn(`[data] 读取 ${opgg} 失败，回退种子：`, e.message);
  }
  return JSON.parse(fs.readFileSync(orig, 'utf8'));
}

export function loadComps() {
  return readPreferred('comps');
}
export function loadVersions() {
  return readPreferred('versions');
}
export function loadItems() {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'items.json'), 'utf8'));
}

// 羁绊派生：从 comps 的 traits 字段聚合出 trait -> 阵容列表。
// 用于 /trait/[name] 长尾 SEO 页与 /trait 索引页、以及 sitemap 的 trait URL。
// 注意：champs.json 无 traits 字段，羁绊→弈子映射暂缺，故只聚合「用到该羁绊的阵容」。
export function loadTraits() {
  const comps = loadComps();
  const map = new Map();
  (comps || []).forEach((c) => {
    (c.traits || []).forEach((t) => {
      if (!map.has(t)) map.set(t, []);
      map.get(t).push({
        compId: c.compId,
        name: c.name,
        tier: c.tier,
        opScore: c.stat?.opScore || 0,
      });
    });
  });
  return [...map.entries()]
    .map(([name, cs]) => ({
      name,
      count: cs.length,
      comps: cs.sort((a, b) => b.opScore - a.opScore),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

// 全量装备图标映射：装备名 -> 官方 CDN 图标。
// 取自 OP.GG 同步产物 data/tft/items.json（140 件全部自带 icon 字段，覆盖率 140/140）。
// 注意：不要改用 data/icons.json —— 那份只有 43/140，红黑榜与奇效装里会有 12 件缺图、退化成文字首字。
export function loadItemIcons() {
  try {
    const arr = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tft', 'items.json'), 'utf8'));
    const map = {};
    arr.forEach((it) => {
      if (it && it.name && it.icon) map[it.name] = it.icon;
    });
    return map;
  } catch (e) {
    console.warn('[data] 读取 tft/items.json 装备图标失败，表格退化为纯文字：', e.message);
    return {};
  }
}
