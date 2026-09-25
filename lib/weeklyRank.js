// 「上周最强阵容」周榜读取层（方案 A · 快照式）
//
// 数据源：data/weekly-comp-rank.json（由 scripts/gen-weekly-rank.mjs 生成）。
// 站点只读这一份「当前生效周榜」；历史存档 weekly-comp-rank-YYYY-MM-DD.json 不参与渲染。
//
// 降级策略：周榜不存在或解析失败时返回 null，调用方回退到全量 comps，
// 保证首页永远不会因为周榜缺失而空白。
import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join(process.cwd(), 'data', 'weekly-comp-rank.json');

export function loadWeeklyRank() {
  try {
    if (!fs.existsSync(FILE)) return null;
    const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (!data || !Array.isArray(data.comps) || data.comps.length === 0) return null;
    return data;
  } catch (e) {
    console.warn('[weekly-rank] 周榜读取失败，回退全量阵容：', e.message);
    return null;
  }
}

// 把周期起止格式化成展示文案，如「09-18 ~ 09-25」
export function formatPeriod(period) {
  if (!period || !period.from || !period.to) return '';
  const short = (d) => (String(d).length > 5 ? String(d).slice(5) : String(d));
  return `${short(period.from)} ~ ${short(period.to)}`;
}
