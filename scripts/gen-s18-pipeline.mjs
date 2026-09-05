// 标准流水线：版本更新当天出 S18 阵容 + 阵容码（人审前稿）。
//
// 一条命令完成：OP.GG 同步 → AI 点评/选取思路/选子技巧 → 阵容码
//              → 写回 data → 产出人审 Markdown。
//
// 用法：node scripts/gen-s18-pipeline.mjs [limit]
// 配合：npm run pipeline
//
// 容错：OP.GG 不可达时自动回退到本地最新 comps.opgg.json / comps.json；
//      AI 缺密钥时 hunyuan.js 返回降级模板，整条流水线仍可跑通。

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { fetchMetaDecks } from '../lib/opgg.js';
import { generateComment, generateRuneGuide, generatePickTips } from '../lib/hunyuan.js';
import { loadCopyLibrary, applyManualCopy } from '../lib/compCopy.js';
import { seasonLabel, SEASON } from '../lib/season.js';
import { buildCompCode, buildCompCodeCompact } from '../lib/compcode.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, '..', 'data');
const limit = Number(process.argv[2] || 30);
const today = new Date().toISOString().slice(0, 10);

// 同步超时护栏：OP.GG 不可达时快速失败并回退本地缓存，避免脚本挂死。
function withTimeout(p, ms) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('OP.GG 同步超时')), ms)),
  ]);
}

async function loadComps() {
  // ① 优先实时同步 OP.GG
  try {
    console.log(`▶ 同步 OP.GG（limit=${limit}）…`);
    const { comps, versionId, patch } = await withTimeout(fetchMetaDecks(limit), 15000);
    console.log(`  ✔ 实时拿到 ${comps.length} 套，版本 ${versionId}`);
    return { comps, versionId, patch, fresh: true };
  } catch (e) {
    console.warn('[pipeline] OP.GG 同步失败，回退本地缓存：', e.message);
  }
  // ② 回退：本地 comps.opgg.json → comps.json
  for (const f of ['comps.opgg.json', 'comps.json']) {
    const p = resolve(DATA, f);
    if (existsSync(p)) {
      try {
        const arr = JSON.parse(readFileSync(p, 'utf8'));
        const comps = Array.isArray(arr) ? arr : arr.comps || [];
        if (comps.length) {
          console.log(`  ⚠ 复用本地 ${f}（${comps.length} 套）`);
          return {
            comps,
            versionId: comps[0]?.versionId || `set${SEASON.no}`,
            patch: SEASON.no,
            fresh: false,
          };
        }
      } catch {}
    }
  }
  throw new Error('无可用阵容数据（OP.GG 不可用且无本地缓存）');
}

const { comps, versionId, patch, fresh } = await loadComps();

// ③ AI 生成（人工文案库优先 → LLM → 降级模板）+ 阵容码
const copyLib = loadCopyLibrary();
let fromLib = 0;
let fromLLM = 0;
for (const c of comps) {
  const manual = copyLib[c.compId]?.aiComment;
  if (manual) {
    c.aiComment = manual;
    fromLib++;
  } else {
    c.aiComment = await generateComment(c);
    fromLLM++;
  }
  if (!c.selectionGuide) c.selectionGuide = await generateRuneGuide(c);
  if (!c.pickTips) c.pickTips = await generatePickTips(c);
  c.compCode = buildCompCode(c);
  c.compCodeShort = buildCompCodeCompact(c);
}
const { applied } = applyManualCopy(comps); // 文案库回填 selectionGuide/pickTips（人工优先）
console.log(`  AI 文案：文案库命中 ${fromLib} / LLM 生成 ${fromLLM}`);
console.log(`  文案库回填 selectionGuide·pickTips：${applied} 套`);

// ④ 写回 data
const tierCount = { T0: 0, T1: 0, T2: 0 };
comps.forEach((c) => {
  tierCount[c.tier] = (tierCount[c.tier] || 0) + 1;
});
const versions = [
  {
    versionId,
    name: seasonLabel(patch),
    patchNo: patch || SEASON.no,
    isCurrent: true,
    releaseDate: today,
    note: fresh ? `OP.GG 实时同步（${today}）` : `复用本地缓存（${today}，OP.GG 不可达）`,
    summary: `本版本共 ${comps.length} 套阵容：T0 ${tierCount.T0}、T1 ${tierCount.T1}、T2 ${tierCount.T2}。版本更新当天即可抄作业，阵容码见各阵容详情。`,
  },
];
writeFileSync(resolve(DATA, 'comps.opgg.json'), JSON.stringify(comps, null, 2), 'utf8');
writeFileSync(resolve(DATA, 'versions.opgg.json'), JSON.stringify(versions, null, 2), 'utf8');
writeFileSync(resolve(DATA, 'comps.json'), JSON.stringify(comps, null, 2), 'utf8');
writeFileSync(resolve(DATA, 'versions.json'), JSON.stringify(versions, null, 2), 'utf8');

// ⑤ 人审 Markdown
const blocks = comps.map((c, i) => {
  const lines = [
    `### ${i + 1}. ${c.name} 〔${c.tier}〕`,
    `- 羁绊：${(c.traits || []).join('、') || '—'}`,
    `- 核心装备：${(c.coreChampions || []).join('、') || '—'}`,
    `- 点评：${c.aiComment || '—'}`,
    `- 选取思路：${c.selectionGuide || '—'}`,
    `- 选子技巧：${c.pickTips || '—'}`,
    '- 阵容码：',
    '```',
    c.compCode || '',
    '```',
    '',
  ];
  return lines.join('\n');
});
const md = [
  `# 弈览 S18 自然之力 · 阵容人审稿（${today}）`,
  '',
  `> 来源：${fresh ? 'OP.GG 实时同步' : '本地缓存（OP.GG 不可达）'} ｜ 共 ${comps.length} 套（T0 ${tierCount.T0}/T1 ${tierCount.T1}/T2 ${tierCount.T2}）`,
  '',
  '## 使用方式',
  '1. 逐条核对 阵容码 / 点评 / 选取思路 / 选子技巧；',
  '2. 确认的文案固化进 `data/comp-copy.json`（按 compId 索引）实现零成本复用；',
  '3. 前端读取 `comps.json` 自动展示。',
  '',
  ...blocks,
].join('\n');
const reviewPath = resolve(DATA, `review-S18-${today}.md`);
writeFileSync(reviewPath, md, 'utf8');

console.log(`✔ 已写回 comps.opgg.json / comps.json / versions.*.json`);
console.log(`✔ 人审稿：${reviewPath}`);
