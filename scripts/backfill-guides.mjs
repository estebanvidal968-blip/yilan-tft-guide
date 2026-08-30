// 回填脚本：为已同步的阵容补上「阵容选取·符文搭配」与「选弈子小技巧」两段攻略。
// 不改动原有字段，只在缺字段时调用混元生成（无密钥则降级模板），写回原文件。
// 用法：node scripts/backfill-guides.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { generateRuneGuide, generatePickTips } from '../lib/hunyuan.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, '..', 'data');
const FILES = ['comps.opgg.json', 'comps.json'];

for (const file of FILES) {
  const path = resolve(DATA, file);
  let arr;
  try {
    arr = JSON.parse(
      (await import('node:fs')).readFileSync(path, 'utf8')
    );
  } catch {
    console.log(`⏭ ${file} 不存在，跳过`);
    continue;
  }
  const comps = Array.isArray(arr) ? arr : arr.comps || arr;
  console.log(`▶ 处理 ${file}（${comps.length} 套）…`);

  let gen = 0;
  for (const c of comps) {
    if (!c.selectionGuide) {
      c.selectionGuide = await generateRuneGuide(c);
      gen++;
    }
    if (!c.pickTips) {
      c.pickTips = await generatePickTips(c);
      gen++;
    }
  }
  const out = Array.isArray(arr) ? comps : { ...arr, comps };
  writeFileSync(path, JSON.stringify(out, null, 2), 'utf8');
  console.log(`  ✔ 写回 ${file}（本次生成 ${gen} 段）`);
}
console.log('全部完成。');
