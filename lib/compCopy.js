// 人工撰写的阵容中文文案库（唯一真源）。
//
// 为什么需要它：
//   scripts/sync-opgg.mjs 每次同步都会从 OP.GG 重建阵容对象，并**无条件覆盖**
//   aiComment（`c.aiComment = await generateComment(c)`）；lib/opgg.js 初始化时
//   也不带 selectionGuide / pickTips 字段。也就是说，直接写进 comps.opgg.json
//   的人工文案会在下一次同步时被冲掉。
//
//   因此把人工文案独立放在 data/comp-copy.json（按 compId 索引），同步之后统一
//   回填。这样：
//     - 已有人文案的阵容：同步后自动恢复，且不消耗任何 LLM 调用（零成本）；
//     - 文案库里没有的新阵容：仍走 LLM 生成 / 模板降级，生成后可固化进文案库。
//
// 本模块只被 scripts/ 下的同步脚本使用，不参与 Next 运行时打包。

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COPY_FILE = resolve(__dirname, '..', 'data', 'comp-copy.json');

export const COPY_FIELDS = ['aiComment', 'selectionGuide', 'pickTips'];

// 读取文案库，返回 { compId: { name, aiComment, selectionGuide, pickTips } }
export function loadCopyLibrary() {
  if (!existsSync(COPY_FILE)) return {};
  try {
    const raw = JSON.parse(readFileSync(COPY_FILE, 'utf8'));
    return raw?.comps || {};
  } catch (e) {
    console.warn('[comp-copy] 文案库解析失败，跳过回填：', e.message);
    return {};
  }
}

// 用文案库回填 comps（原地修改）。返回 { applied, missing }。
export function applyManualCopy(comps) {
  const lib = loadCopyLibrary();
  let applied = 0;
  const missing = [];

  for (const c of comps) {
    const entry = lib[c.compId];
    if (!entry) {
      missing.push(c.compId);
      continue;
    }
    for (const f of COPY_FIELDS) {
      if (entry[f]) c[f] = entry[f];
    }
    applied++;
  }

  return { applied, missing };
}
