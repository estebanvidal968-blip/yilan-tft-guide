// 国服 meta 校准库（唯一真源）。
//
// 为什么需要它：
//   项目阵容数据源是 OP.GG，那是**全球服（TFT Set18）**数据，与金铲铲国服平衡
//   **不一致**。实测差异（2026-09-05 联网核实）：
//     ① 国服「大红」被动需击杀才能触发，云顶不需要 → 单卡强度不同；
//     ② 国服蓝霸符获取难度高、二星困难；
//     ③ T0 梯队不同——国服断层 T0 是「森林月男」，OP.GG 却只给 T1。
//   scripts/sync-opgg.mjs 每次同步都会从 OP.GG 重建阵容并覆盖 tier / name，
//   直接写进 comps.json 的校准会在下一次同步时被冲掉。
//
//   因此把国服校准独立放在 data/cn-meta.json，同步之后统一回填：
//     - tierOverride：按国服实测重排 tier（可同时改名，标注国服通行叫法）；
//     - deduplicate：剔除 OP.GG 同步产生的同名重复条目；
//     - extraComps：补充国服独有、OP.GG 榜单完全没有的阵容；
//     - sourceLabel / sourceNote：统一对外的「数据口径」标注文案。
//
// 本模块只被 scripts/ 下的同步脚本使用，不参与 Next 运行时打包。

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const META_FILE = resolve(__dirname, '..', 'data', 'cn-meta.json');

const TIER_RANK = { T0: 0, T1: 1, T2: 2, T3: 3 };

// 读取国服校准库
export function loadCnMeta() {
  if (!existsSync(META_FILE)) return null;
  try {
    return JSON.parse(readFileSync(META_FILE, 'utf8'));
  } catch (e) {
    console.warn('[cn-meta] 国服校准库解析失败，跳过校准：', e.message);
    return null;
  }
}

// 应用国服校准（原地修改 comps 数组）。
// 返回 { tierApplied, deduped, added, total }
export function applyCnMeta(comps) {
  const meta = loadCnMeta();
  if (!meta || !Array.isArray(comps)) {
    return { tierApplied: 0, deduped: 0, added: 0, total: comps?.length || 0 };
  }

  const tierOverride = meta.tierOverride || {};
  const dedupeNames = meta.deduplicate?.names || [];
  const extraComps = meta.extraComps || [];
  const sourceLabel = meta.sourceLabel || '国服实测';
  const updatedAt = meta.updatedAt || new Date().toISOString().slice(0, 10);

  // ① 去重：同名只保留 tier 最高的一条（同名时优先保留已有高 tier）
  let deduped = 0;
  const seen = new Map();
  const dedupedArr = [];
  for (const c of comps) {
    if (dedupeNames.includes(c.name)) {
      const prev = seen.get(c.name);
      if (prev) {
        const prevRank = TIER_RANK[prev.tier] ?? 9;
        const curRank = TIER_RANK[c.tier] ?? 9;
        if (curRank < prevRank) {
          // 当前这条 tier 更高，替换掉之前的
          const idx = dedupedArr.indexOf(prev);
          if (idx !== -1) dedupedArr[idx] = c;
          seen.set(c.name, c);
        }
        deduped++;
        continue;
      }
      seen.set(c.name, c);
    }
    dedupedArr.push(c);
  }
  comps.length = 0;
  comps.push(...dedupedArr);

  // ② tier / name 覆盖 + 统一数据口径标注
  let tierApplied = 0;
  for (const c of comps) {
    const ov = tierOverride[c.name];
    if (ov) {
      if (ov.tier) c.tier = ov.tier;
      if (ov.name) c.name = ov.name;
      tierApplied++;
    }
    // 统一标注：OP.GG 同步来的条目改标国服口径
    c.source = sourceLabel;
    c.sourceNote = meta.sourceNote || '';
    c.updatedAt = c.updatedAt || updatedAt;
  }

  // ③ 追加国服独有阵容（避免重复插入）
  let added = 0;
  const existIds = new Set(comps.map((c) => c.compId));
  for (const extra of extraComps) {
    if (existIds.has(extra.compId)) continue;
    const copy = {
      versionId: 'set18',
      alias: '',
      earlyGame: '',
      midGame: '',
      lateGame: '',
      counters: [],
      counteredBy: [],
      stationMapUrl: '',
      positionTip: '',
      aiComment: '',
      positions: [],
      roster: [],
      hasStation: false,
      ...extra,
      source: sourceLabel,
      sourceNote: meta.sourceNote || '',
      updatedAt: extra.updatedAt || updatedAt,
    };
    comps.push(copy);
    existIds.add(copy.compId);
    added++;
  }

  // ④ 按 tier 排序（T0 → T1 → T2），同级保持原顺序
  comps.sort((a, b) => (TIER_RANK[a.tier] ?? 9) - (TIER_RANK[b.tier] ?? 9));

  return { tierApplied, deduped, added, total: comps.length };
}

// 供页面展示的「数据口径」说明
export function getSourceNote() {
  const meta = loadCnMeta();
  return meta?.sourceNote || '';
}

export function getMetaUpdatedAt() {
  const meta = loadCnMeta();
  return meta?.updatedAt || '';
}
