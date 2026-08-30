// 服务端数据读取层（仅用于 Server Component / API 路由，绝不进前端包）。
// 优先读取同步脚本生成的 data/*.opgg.json（OP.GG 实时数据），
// 若不存在则回退到手工种子 data/*.json，保证未跑同步时站点仍可正常展示。
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');

function readPreferred(base) {
  const opgg = path.join(DATA_DIR, `${base}.opgg.json`);
  const orig = path.join(DATA_DIR, `${base}.json`);
  try {
    if (fs.existsSync(opgg)) {
      return JSON.parse(fs.readFileSync(opgg, 'utf8'));
    }
  } catch (e) {
    console.warn(`[data] 读取 ${opgg} 失败，回退种子：`, e.message);
  }
  return JSON.parse(fs.readFileSync(orig, 'utf8'));
}

export function loadComps() {
  return readPreferred('comps');
}
export function loadVersions() {
  return readPreferred('versions');
}
export function loadItems() {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'items.json'), 'utf8'));
}
