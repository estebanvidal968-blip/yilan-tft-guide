// 同步脚本：拉取 OP.GG 当前版本阵容 → 混元生成中文评语 → 写回 data/*.json
// 用法：node scripts/sync-opgg.mjs [limit]
// 环境变量：HUNYUAN_SECRET_ID / HUNYUAN_SECRET_KEY（缺则混元评语降级为模板）
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fetchMetaDecks } from '../lib/opgg.js';
import { generateComment } from '../lib/hunyuan.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, '..', 'data');
const limit = Number(process.argv[2] || 30);

console.log(`▶ 拉取 OP.GG 阵容（limit=${limit}）…`);
const { comps, versionId, patch } = await fetchMetaDecks(limit);
console.log(`  拿到 ${comps.length} 套，版本 ${versionId} (patch ${patch || '?'})`);

console.log('▶ 调用混元生成中文评语…');
for (const c of comps) {
  c.aiComment = await generateComment(c);
}
console.log(`  生成完成（${comps.filter((c) => c.aiComment).length} 套）`);

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
