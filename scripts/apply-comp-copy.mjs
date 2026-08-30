// 回填脚本：把 data/comp-copy.json 里的人工文案回填进阵容数据文件。
//
// 用途：
//   1) 手动执行：node scripts/apply-comp-copy.mjs
//   2) 被 sync-opgg.mjs 在同步末尾自动调用，防止人工文案被同步覆盖。
//
// 文案库中没有的阵容不会被改动（留给 LLM 生成或模板降级）。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { applyManualCopy } from '../lib/compCopy.js';

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
  const { applied, missing } = applyManualCopy(comps);

  const out = Array.isArray(arr) ? comps : { ...arr, comps };
  writeFileSync(path, JSON.stringify(out, null, 2), 'utf8');

  console.log(`✔ ${file}：回填 ${applied} 套${missing.length ? `，文案库未覆盖 ${missing.length} 套（保持原样）` : ''}`);
}
