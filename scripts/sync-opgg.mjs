// 同步脚本：拉取 OP.GG 当前版本阵容 → 生成中文评语 → 写回 data/*.json
//
// 评语来源优先级（成本控制 + 防止人工文案被覆盖）：
//   ① data/comp-copy.json 人工文案库命中 → 直接复用，不消耗任何 LLM 调用；
//   ② 未命中 → 调 LLM（LLM_* 或 HUNYUAN_SECRET_*），缺密钥则降级为数据驱动模板。
// 写回前会再用文案库统一回填 selectionGuide / pickTips
// （同步会重建阵容对象，这两个字段不在 OP.GG 原始数据里，容易丢失）。
//
// 用法：node scripts/sync-opgg.mjs [limit]
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fetchMetaDecks } from '../lib/opgg.js';
import { generateComment } from '../lib/hunyuan.js';
import { applyManualCopy, loadCopyLibrary } from '../lib/compCopy.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, '..', 'data');
const limit = Number(process.argv[2] || 30);

console.log(`▶ 拉取 OP.GG 阵容（limit=${limit}）…`);
const { comps, versionId, patch } = await fetchMetaDecks(limit);
console.log(`  拿到 ${comps.length} 套，版本 ${versionId} (patch ${patch || '?'})`);

console.log('▶ 生成中文评语（人工文案库优先）…');
const copyLib = loadCopyLibrary();
let fromLib = 0;
let fromLLM = 0;
for (const c of comps) {
  const manual = copyLib[c.compId]?.aiComment;
  if (manual) {
    c.aiComment = manual; // 人工文案优先，零 LLM 调用成本
    fromLib++;
  } else {
    c.aiComment = await generateComment(c);
    fromLLM++;
  }
}
console.log(`  文案库命中 ${fromLib} 套（零调用），LLM/模板生成 ${fromLLM} 套`);

// 同步会重建阵容对象，selectionGuide / pickTips 不在 OP.GG 原始数据里，
// 统一从文案库回填，避免每次同步后丢失。
const { applied } = applyManualCopy(comps);
console.log(`  文案库回填选取思路/选子技巧：${applied} 套`);

const today = new Date().toISOString().slice(0, 10);
const setLabel = `金铲铲 S${String(patch || '18').split('.')[0]} 自然之力`;
const tiers = { T0: 0, T1: 0, T2: 0 };
comps.forEach((c) => { tiers[c.tier] = (tiers[c.tier] || 0) + 1; });
const versions = [
  {
    versionId,
    name: setLabel,
    patchNo: patch || '?',
    isCurrent: true,
    releaseDate: today,
    note: `OP.GG 实时同步（${today}）`,
    summary: `本版本共 ${comps.length} 套阵容同步自 OP.GG：T0 ${tiers.T0} 套、T1 ${tiers.T1} 套、T2 ${tiers.T2} 套。版本更新当天即可抄作业，具体运营见各阵容站位与装备建议。`,
  },
];

writeFileSync(resolve(DATA, 'comps.opgg.json'), JSON.stringify(comps, null, 2), 'utf8');
writeFileSync(resolve(DATA, 'versions.opgg.json'), JSON.stringify(versions, null, 2), 'utf8');
console.log(`✔ 已写回 data/comps.opgg.json (${comps.length}) 与 data/versions.opgg.json`);
console.log('  样例：', comps[0]?.name, '/', comps[0]?.tier, '/', comps[0]?.aiComment?.slice(0, 40) + '…');
