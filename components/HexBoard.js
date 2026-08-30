'use client';

import { useMemo, useState } from 'react';
import IconImg from './IconImg';
import icons from '@/data/icons.json';

/**
 * 真实 TFT 棋盘：4 行 × 7 列，pointy-top 六边形，odd-r 交错。
 * row 0 = 最前排（贴近对手），row 3 = 最后排（沉底）。
 * 每个棋子用圆形英雄头像呈现，加载失败回退为短名。
 */
const ROWS = 4;
const COLS = 7;
const R = 30; // 外接圆半径
const PAD = 10;
const HEX_W = Math.sqrt(3) * R; // ≈51.96
const ROW_STEP = 1.5 * R; // 45

const BOARD_W = PAD * 2 + COLS * HEX_W + HEX_W / 2;
const BOARD_H = PAD * 2 + 6.5 * R;

function hexPath(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = ((60 * i - 90) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

function center(row, col) {
  const cx = PAD + HEX_W / 2 + col * HEX_W + (row % 2 ? HEX_W / 2 : 0);
  const cy = PAD + R + row * ROW_STEP;
  return { cx, cy };
}

/** 棋子名压到两字，避免溢出六边形 */
function shortName(name) {
  if (name.length <= 2) return name;
  if (name.length === 3) return name.slice(0, 2);
  return name.slice(0, 2);
}

export default function HexBoard({ positions = [], tip = '' }) {
  const [active, setActive] = useState(null);

  // 兜底：所有棋子坐标相同（退化数据）时，不渲染叠格，提示暂无标准站位。
  const degenerate =
    positions.length > 0 && new Set(positions.map((p) => `${p.row}-${p.col}`)).size === 1;

  const byCell = useMemo(() => {
    const m = new Map();
    positions.forEach((p) => m.set(`${p.row}-${p.col}`, p));
    return m;
  }, [positions]);

  const cells = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push({ row, col, unit: byCell.get(`${row}-${col}`) || null });
    }
  }

  const shown = active || positions.find((p) => p.carry) || null;

  if (degenerate) {
    return (
      <div className="hexboard">
        <p className="hb-tip">
          <span className="hb-tip-label">站位要点</span>
          该阵容暂无标准站位数据，棋子未标注棋盘坐标。
        </p>
      </div>
    );
  }

  return (
    <div className="hexboard">
      <div className="hb-axis">
        <span>↑ 前排（贴线）</span>
        <span className="muted">4 × 7</span>
      </div>

      <svg
        viewBox={`0 0 ${BOARD_W.toFixed(0)} ${BOARD_H.toFixed(0)}`}
        role="img"
        aria-label="阵容站位棋盘"
        className="hb-svg"
      >
        {cells.map(({ row, col, unit }, i) => {
          const { cx, cy } = center(row, col);
          const delay = (row * COLS + col) * 24;
          const cls = [
            'hb-cell',
            unit ? 'is-unit' : 'is-empty',
            unit?.carry ? 'is-carry' : '',
            shown && unit && shown.champ === unit.champ ? 'is-active' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <g
              key={`${row}-${col}`}
              className={cls}
              style={{ animationDelay: `${delay}ms`, transformOrigin: `${cx}px ${cy}px` }}
              onMouseEnter={() => unit && setActive(unit)}
              onMouseLeave={() => unit && setActive(null)}
              onFocus={() => unit && setActive(unit)}
              onBlur={() => unit && setActive(null)}
              tabIndex={unit ? 0 : -1}
            >
              <polygon className="hb-hex" points={hexPath(cx, cy, R - 1.5)} />
              {unit?.carry && (
                <polygon className="hb-inner" points={hexPath(cx, cy, R - 8)} />
              )}

              {unit && (
                <foreignObject
                  x={cx - R * 0.64}
                  y={cy - R * 0.64}
                  width={R * 1.28}
                  height={R * 1.28}
                  className="hb-fo"
                >
                  <span className={`hb-token cost${unit.cost || 1}`}>
                    <IconImg
                      src={icons.champion?.[unit.champ]}
                      alt={unit.champ}
                      className="hb-champ"
                      fallback={shortName(unit.champ)}
                    />
                    <span className="badge">S18</span>
                  </span>
                </foreignObject>
              )}

              {unit && (
                <text className="hb-cost" x={cx} y={cy + R * 0.74} textAnchor="middle">
                  {'★'.repeat(unit.stars || 1)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="hb-axis hb-axis-bottom">
        <span>↓ 后排（沉底）</span>
        <span className="muted">悬停棋子看装备</span>
      </div>

      {shown && (
        <div className="hb-readout" key={shown.champ}>
          <div className="hb-ro-head">
            <span className="hb-ro-name">{shown.champ}</span>
            {shown.carry && <span className="hb-ro-flag">C 位</span>}
            <span className="muted hb-ro-cost">{shown.cost} 费 · {shown.stars || 1} 星</span>
          </div>
          <div className="hb-ro-items">
            {shown.items?.length ? (
              shown.items.map((it) => (
                <span key={it} className="tag">
                  {it}
                </span>
              ))
            ) : (
              <span className="muted">无核心装备需求</span>
            )}
          </div>
        </div>
      )}

      {tip && (
        <p className="hb-tip">
          <span className="hb-tip-label">站位要点</span>
          {tip}
        </p>
      )}
    </div>
  );
}
