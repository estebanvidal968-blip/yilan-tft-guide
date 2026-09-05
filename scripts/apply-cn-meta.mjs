// 回填脚本：把 data/cn-meta.json 的国服校准（tier 重排 / 去重 / 补充国服独有阵容 / 统一标注）
// 回填进阵容数据文件。
//
// 用途：
//   1) 手动执行：node scripts/apply-cn-meta.mjs
//   2) 被 sync-opgg.mjs / gen-s18-pipeline.mjs 在同步末尾自动调用，防止国服校准被 OP.GG 同步覆盖。
//
// 必须在 apply-comp-copy.mjs 之后执行（人工文案优先，国服校准只动 tier / 结构 / 标注）。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { applyCnMeta } from '../lib/cnMeta.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, '..', 'data');
const FILES = ['comps.opgg.json', 'comps.json'];

for (const file of FILES) {
  const path = resolve(DATA, file);
  if (!existsSync(path)) {
    console.log(`⏭ ${file} 不存在，跳过`);
    continue;
  }

  let arr;
  try {
    arr = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.log(`✗ ${file} 解析失败：${e.message}`);
    continue;
  }

  const comps = Array.isArray(arr) ? arr : arr.comps || arr;
  const { tierApplied, deduped, added, total } = applyCnMeta(comps);

  const out = Array.isArray(arr) ? comps : { ...arr, comps };
  writeFileSync(path, JSON.stringify(out, null, 2), 'utf8');

  console.log(
    `✔ ${file}：tier 校准 ${tierApplied} 套 / 去重 ${deduped} 条 / 补入国服阵容 ${added} 套 → 共 ${total} 套`
  );
}
