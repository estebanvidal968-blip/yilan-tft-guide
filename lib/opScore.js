/**
 * 把 OP.GG 的 opScore（出场量 × 胜率综合分）翻译成玩家一眼能懂的「预估胜率 / 平均名次」。
 *
 * 数据来源：data/comps.opgg.json 全部 10 套 T0 阵容 opScore 范围 0.65 ~ 4.04。
 * 公式假设：
 *   - 8 名赛制，五五开平均名次 = 4.50（基线）
 *   - 五五开胜率 ≈ 10%（TFT 上分赛制下绝对胜率天然偏低）
 *   - 顶级阵容 → 名次 3.00、胜率 20%；最弱 → 名次 4.50、胜率 10%
 *   - 翻译仅供「相对强弱」参考，不构成绝对胜率预测。
 */

const MIN = 0.65;
const MAX = 4.05;

export function translateOpScore(opScore) {
  if (typeof opScore !== 'number' || !isFinite(opScore)) return null;
  const norm = Math.max(0, Math.min(1, (opScore - MIN) / (MAX - MIN)));
  const winRate = 0.10 + 0.10 * norm;        // 10% ~ 20%
  const avgPlacement = 4.5 - 1.5 * norm;      // 4.50 ~ 3.00
  return {
    winRate,        // 小数（0.10 ~ 0.20）
    avgPlacement,  // 数字（3.00 ~ 4.50）
    norm,          // 0~1 归一化强度
    raw: opScore,
  };
}

export function formatWinRate(winRate) {
  if (winRate == null) return '—';
  return (winRate * 100).toFixed(1) + '%';
}

export function formatAvgPlacement(ap) {
  if (ap == null) return '—';
  return ap.toFixed(2);
}