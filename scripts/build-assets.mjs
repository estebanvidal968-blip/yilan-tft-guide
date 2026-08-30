// 资源构建：为数据中的英雄 / 装备生成官方图标 URL，写回 data/icons.json。
// 英雄 → Riot Data Dragon（静态 CDN，版本写死已验证可用）
// 装备 → OP.GG TFT CDN（tft_list_item_combinations 返回的 icon 字段）
// 羁绊暂无可靠免费图标源，页面用样式文字芯片呈现。
// 用法：node scripts/build-assets.mjs
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { OpggClient } from '../lib/opgg.js';
import { CHAMPION_MAP, CHAMPION_EXTRA } from '../lib/riot-names.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, '..', 'data');
const UNITS_DIR = resolve(__dirname, '..', 'public', 'units');

const DD_VER = '16.17.1';
const DD_BASE = `https://ddragon.leagueoflegends.com/cdn/${DD_VER}/img/champion/`;

const load = (p) => JSON.parse(readFileSync(resolve(DATA, p), 'utf8'));
const hasCJK = (s) => /[一-鿿]/.test(s);

// 校验 DDragon 英雄头像是否真实存在，存在才采用，避免破图
async function ddragonUrl(key) {
  const url = DD_BASE + key + '.png';
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok ? url : null;
  } catch { return null; }
}

function collectChampions(comps) {
  const set = new Set();
  comps.forEach((c) => {
    (c.positions || []).forEach((p) => set.add(p.champ));
    (c.roster || []).forEach((p) => set.add(p.champ));
    (c.coreChampions || []).forEach((n) => set.add(n));
  });
  return [...set];
}

function collectItems(comps, itemsFile) {
  const set = new Set();
  comps.forEach((c) => {
    (c.positions || []).forEach((p) => (p.items || []).forEach((i) => set.add(i)));
    (c.roster || []).forEach((p) => (p.items || []).forEach((i) => set.add(i)));
    (c.coreItems || []).forEach((i) => set.add(i));
  });
  (itemsFile || []).forEach((i) => set.add(i.name));
  return [...set];
}

async function build() {
  const comps = load('comps.opgg.json');
  let itemsFile = [];
  try { itemsFile = load('items.json'); } catch {}

  const champNames = collectChampions(comps);
  const itemNames = collectItems(comps, itemsFile);

  // 中文名 → 英文 key（反查 CHAMPION_MAP / CHAMPION_EXTRA）
  const revChamp = {};
  Object.entries({ ...CHAMPION_MAP, ...CHAMPION_EXTRA }).forEach(([k, v]) => { revChamp[v] = k; });

  const champion = {};
  const champMissing = [];
  for (const n of champNames) {
    // 中文名 → 英文 key（用于反查 DDragon 与本地拖入式立绘文件名）
    let engKey = revChamp[n];
    if (!engKey && !hasCJK(n)) {
      const merged = n.replace(/\s+/g, '');
      const cands = [
        merged, n,
        merged.replace(/^./, (c) => c.toUpperCase()).replace(/(?<=.)./g, (c) => c.toLowerCase()),
        merged.toLowerCase(),
      ];
      engKey = cands.find(Boolean);
    }
    // ① 优先使用本地 public/units/{engKey}.png（赛季专属立绘拖入式，覆盖默认头像）
    if (engKey) {
      const local = resolve(UNITS_DIR, engKey + '.png');
      if (existsSync(local)) { champion[n] = '/units/' + engKey + '.png'; continue; }
    }
    // ② 回退 Data Dragon 标准头像
    if (engKey) {
      const ok = await ddragonUrl(engKey);
      if (ok) { champion[n] = ok; continue; }
    }
    champMissing.push(n);
  }

  // 装备图标：OP.GG tft_list_item_combinations 的直接 icon 字段
  const item = {};
  const itemMissing = [];
  try {
    const cli = new OpggClient();
    await cli.init();
    const r = await cli.callTool('tft_list_item_combinations', { lang: 'zh_CN' });
    const byName = {};
    (r.data || []).forEach((it) => {
      if (it.name) byName[it.name] = it.icon || (it.org && it.org.imageUrl) || null;
    });
    itemNames.forEach((n) => {
      if (byName[n]) item[n] = byName[n];
      else itemMissing.push(n);
    });
  } catch (e) {
    console.warn('[assets] 装备图标获取失败（将回退文字）：', e.message);
  }

  const out = { ddragonVersion: DD_VER, generatedAt: new Date().toISOString().slice(0, 10), champion, item };
  writeFileSync(resolve(DATA, 'icons.json'), JSON.stringify(out, null, 1));

  console.log(`✔ data/icons.json 已生成`);
  console.log(`  英雄头像：${Object.keys(champion).length}/${champNames.length}` + (champMissing.length ? `，未解析：${champMissing.join('、')}` : '，全覆盖'));
  console.log(`  装备图标：${Object.keys(item).length}/${itemNames.length}` + (itemMissing.length ? `，未解析：${itemMissing.slice(0, 20).join('、')}` : '，全覆盖'));
}

build().catch((e) => { console.error('[assets] 失败：', e); process.exit(1); });
