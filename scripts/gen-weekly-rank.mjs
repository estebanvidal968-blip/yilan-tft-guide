// 生成「上周最强阵容」周榜快照（方案 A · 快照式）
//
// 设计：
//   - 输入：data/comps.opgg.json（由 sync-opgg.mjs 同步得到）
//   - 排序：按 OP.GG opScore 降序，截取 Top N（默认 8）
//   - 产出两份：
//       1) data/weekly-comp-rank.json            —— 「当前生效周榜」，站点只读这一份
//       2) data/weekly-comp-rank-YYYY-MM-DD.json —— 历史存档，用于回溯与审计
//   - 统计周期 period：from = 上一份周榜的生成日（无则 to-7 天），to = 今天
//
// 为什么只留 Top N：首页推荐位只放「上一周最强」的阵容，避免长尾稀释注意力。
//
// 用法：node scripts/gen-weekly-rank.mjs [topN]
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(__dirname, '..', 'data');
const topN = Number(process.argv[2] || 8);

const SRC = resolve(DATA, 'comps.opgg.json');
const LATEST = resolve(DATA, 'weekly-comp-rank.json');

function today() {
  // 统一用北京时间（与 push-seo 的时区口径一致）
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
}

function shiftDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

if (!existsSync(SRC)) {
  console.error('✖ 找不到 data/comps.opgg.json，请先跑 npm run sync');
  process.exit(1);
}

const comps = JSON.parse(readFileSync(SRC, 'utf8'));
const to = today();

// 上一份周榜的生成日 → 作为本周统计周期的起点
let from = shiftDays(to, -7);
if (existsSync(LATEST)) {
  try {
    const prev = JSON.parse(readFileSync(LATEST, 'utf8'));
    if (prev?.period?.from) {
      // 同一天重复生成时沿用上一份的起点，否则周期会退化成 0 天
      from = prev.generatedAt === to ? prev.period.from : prev.generatedAt || prev.period.from;
    }
  } catch (e) {
    console.warn('[weekly-rank] 上一份周榜解析失败，周期起点回退为 7 天前：', e.message);
  }
}

// 按 opScore 降序 → 取 Top N。只收有人工文案的阵容，避免模板套话进推荐位。
const scored = comps
  .map((c) => ({ ...c, _score: (c.stat && c.stat.opScore) || 0 }))
  .sort((a, b) => b._score - a._score);

// 保留完整阵容对象（CompCard 需要 positions / stat / source / updatedAt 等字段），
// 只额外补一个 rank，避免首页卡片渲染缺失。
const picked = scored.slice(0, topN).map((c, i) => {
  const { _score, ...rest } = c;
  return { ...rest, rank: i + 1, opScore: Number(_score.toFixed(4)) };
});

// 自检：推荐位不允许出现模板文案（否则说明文案库没命中）
const tpl = picked.filter((c) => c.aiComment.includes('OP.GG 实时统计'));
if (tpl.length > 0) {
  console.error(`✖ 自检失败：Top ${topN} 中有 ${tpl.length} 套仍是模板文案 → ${tpl.map((c) => c.name).join('、')}`);
  console.error('  请先把文案补进 data/comp-copy.json 再生成周榜。');
  process.exit(2);
}
if (picked.length < 6) {
  console.error(`✖ 自检失败：可用阵容仅 ${picked.length} 套（阈值 6），疑似同步异常，已中止。`);
  process.exit(3);
}

const payload = {
  generatedAt: to,
  period: { from, to },
  season: 'S18 自然之力',
  totalScanned: comps.length,
  topN,
  comps: picked,
};

writeFileSync(LATEST, JSON.stringify(payload, null, 2), 'utf8');
writeFileSync(resolve(DATA, `weekly-comp-rank-${to}.json`), JSON.stringify(payload, null, 2), 'utf8');

console.log(`✔ 周榜已生成（统计周期 ${from} → ${to}）`);
console.log(`  扫描 ${comps.length} 套 → 入选 ${picked.length} 套`);
picked.forEach((c) => {
  console.log(`   ${String(c.rank).padStart(2)}. [${c.tier}] ${c.name}  opScore ${c.opScore}`);
});
