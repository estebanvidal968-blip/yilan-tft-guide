// 基于 OP.GG 抓取聚合后的 data/tft/items.json + top-builds.json，
// 计算「装备红黑榜」所需信号。纯数据驱动，不引入任何外部文案。
//
//   node scripts/analyze-items.mjs
//
// 输出：
//   1) 红榜候选：按 使用量 × 名次增益 综合分排序
//   2) 黑榜候选：使用量不低但平均名次差（被高估）
//   3) 冷门高期待：神器/光明/纹章里几乎没人出的（名气大、实战少）

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = path.join(ROOT, 'data', 'tft');
const items = JSON.parse(fs.readFileSync(path.join(D, 'items.json'), 'utf8'));
const list = items.data || items;
const builds = JSON.parse(fs.readFileSync(path.join(D, 'top-builds.json'), 'utf8'));

// 中性基线 = 全装备加权平均名次（按样本量加权）。代表「出了某件成装后的平均名次」。
let sw = 0, swp = 0;
for (const i of list) {
  const n = i.sampleCount || 0;
  if (n > 0) { sw += n; swp += n * i.avgPlacement; }
}
const BASELINE = sw ? swp / sw : 4.0;
console.log(`基线平均名次 BASELINE = ${BASELINE.toFixed(3)}（按 ${sw} 样本加权）`);

// 基础组件（散件）不参与红黑榜，它们本就是半成品、名次天然中庸。
const COMPONENTS = new Set([
  '暴风大剑','反曲之弓','无用大棒','女神之泪','巨人腰带','锁子甲',
  '负极斗篷','拳套','金铲铲','负极斗篷','红水晶','短剑','斗篷','腰带','护甲','魔杖','眼泪','大剑','弓',
]);
const isComponent = (i) => COMPONENTS.has(i.name);

const withData = list.filter((i) => i.sampleCount > 0 && !isComponent(i));
console.log(`有对局数据的装备（剔除散件）：${withData.length} / ${list.length}`);

// 综合红分 = 使用量(sampleCount) × 名次增益(baseline - avgPlacement)
const scored = withData.map((i) => ({
  name: i.name, kind: i.kind, sampleCount: i.sampleCount,
  avgPlacement: i.avgPlacement,
  gain: +(BASELINE - i.avgPlacement).toFixed(3),
  red: +(i.sampleCount * (BASELINE - i.avgPlacement)).toFixed(0),
  best: (i.best || []).slice(0, 3).map((b) => `${b.champName}(${(b.delta||0).toFixed(2)})`).join('、'),
}));

console.log('\n=== 红榜候选 Top 18（使用量 × 名次增益） ===');
scored.sort((a, b) => b.red - a.red);
for (const i of scored.slice(0, 18)) {
  console.log(`${String(i.red).padStart(9)} | ${i.avgPlacement.toFixed(2)}名 | 量${String(i.sampleCount).padStart(6)} | ${i.name}（${i.kind}） | 强适配: ${i.best}`);
}

console.log('\n=== 黑榜候选：使用量≥8000 但平均名次≥基线+0.15（被高估/慎选） ===');
const black = scored
  .filter((i) => i.sampleCount >= 8000 && i.avgPlacement >= BASELINE + 0.15)
  .sort((a, b) => b.avgPlacement - a.avgPlacement);
for (const i of black) {
  console.log(`${i.avgPlacement.toFixed(2)}名 | 量${String(i.sampleCount).padStart(6)} | ${i.name}（${i.kind}） | 增益${i.gain}`);
}

console.log('\n=== 名气大实战少：神器/光明/纹章 中 sampleCount<300 ===');
const hype = list.filter((i) => ['神器','光明版','纹章'].includes(i.kind) && i.sampleCount < 300)
  .sort((a, b) => a.sampleCount - b.sampleCount);
for (const i of hype) {
  console.log(`量${String(i.sampleCount).padStart(5)} | ${i.name}（${i.kind}）`);
}
