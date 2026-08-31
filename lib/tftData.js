// data/tft/*.json 的读取层。这些文件由 scripts/sync-tft-data.mjs 生成，
// 全部是 OP.GG 真实对局统计，站点只读不写。
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'data', 'tft');

function readJson(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, name), 'utf8'));
  } catch {
    return fallback;
  }
}

export const loadItems = () => readJson('items.json', []);
export const loadChamps = () => readJson('champs.json', []);
export const loadAugments = () => readJson('augments.json', []);
export const loadTopBuilds = () => readJson('top-builds.json', []);
export const loadTftMeta = () => readJson('meta.json', null);

export const getItem = (id) => loadItems().find((i) => i.id === id) || null;
export const getChamp = (id) => loadChamps().find((c) => c.id === id) || null;
export const getAugment = (id) => loadAugments().find((a) => a.id === id) || null;

// 名次增益：正数 = 该搭配让平均名次变好（数值越小越好）
export const fmtDelta = (d) => (d > 0 ? `−${Math.abs(d).toFixed(2)}` : `+${Math.abs(d).toFixed(2)}`);
export const pct = (v) => `${(Number(v) || 0) * 100 >= 10 ? ((Number(v) || 0) * 100).toFixed(0) : ((Number(v) || 0) * 100).toFixed(1)}%`;
export const num = (v) => (Number(v) || 0).toLocaleString('zh-CN');

// 装备分类展示顺序：能对局验证的在前
export const ITEM_KINDS = ['成装', '神器', '纹章', '散件', '光明版', '金铲铲', '消耗品'];
