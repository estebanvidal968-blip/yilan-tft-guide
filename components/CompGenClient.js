'use client';

import { useState, useMemo } from 'react';
import CompCard from './CompCard';
import champs from '@/data/tft/champs.json';
import comps from '@/data/comps.opgg.json';

const COMPS = comps || [];

// 棋池：全部弈子（中文名），用于「我有这些棋子」多选
const CHAMP_MAP = new Map(champs.map((c) => [c.id, c]));
const CHAMP_POOL = champs
  .map((c) => ({ id: c.id, name: c.name, cost: c.cost }))
  .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name, 'zh'));

// tier 加权：越强越容易抽到
const TIER_W = { T0: 5, T1: 3, T2: 2, T3: 1, '': 1 };
function pickWeighted(avoidId) {
  const pool = COMPS.filter((c) => c.compId !== avoidId);
  const tot = pool.reduce((s, c) => s + (TIER_W[c.tier] || 1), 0);
  let r = Math.random() * tot;
  for (const c of pool) {
    r -= TIER_W[c.tier] || 1;
    if (r <= 0) return c;
  }
  return pool[0];
}

function computeFit(ownedIds) {
  const ownedNames = new Set(ownedIds.map((id) => CHAMP_MAP.get(id)?.name).filter(Boolean));
  return COMPS.map((c) => {
    const core = c.coreChampions || [];
    const hit = core.filter((n) => ownedNames.has(n)).length;
    const cov = core.length ? hit / core.length : 0;
    return { comp: c, hit, cov };
  })
    .filter((x) => x.hit > 0)
    .sort((a, b) => b.cov - a.cov || b.hit - a.hit)
    .slice(0, 3);
}

export default function CompGenClient() {
  const [mode, setMode] = useState('random'); // 'random' | 'fit'
  const [drawn, setDrawn] = useState(null);
  const [owned, setOwned] = useState([]); // champ ids
  const [fit, setFit] = useState(null);

  function draw() {
    setDrawn(pickWeighted(drawn?.compId));
  }
  function toggleOwned(id) {
    setOwned((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
    setFit(null);
  }

  return (
    <div className="comp-gen">
      <div className="cg-tabs">
        <button className={`cg-tab ${mode === 'random' ? 'on' : ''}`} onClick={() => setMode('random')}>
          🎲 抽一套版本阵容
        </button>
        <button className={`cg-tab ${mode === 'fit' ? 'on' : ''}`} onClick={() => setMode('fit')}>
          🧩 按已有棋子匹配
        </button>
      </div>

      {mode === 'random' && (
        <div className="cg-panel">
          <p className="section-sub">
            手气不错就抽一套当前版本强势阵容，按 tier 加权（T0 更容易出）。点击卡片看站位、C 位装备与 AI 点评，
            还能顺手收藏 / 点赞。
          </p>
          <div className="cg-actions">
            <button className="btn primary" onClick={draw}>
              🎲 抽一套版本阵容
            </button>
            {drawn && (
              <button className="btn ghost" onClick={draw}>
                ↺ 换一套
              </button>
            )}
          </div>
          {drawn && (
            <div className="cg-result">
              <CompCard comp={drawn} index={0} />
            </div>
          )}
        </div>
      )}

      {mode === 'fit' && (
        <div className="cg-panel">
          <p className="section-sub">
            勾选你这把手里有的棋子，自动按<b>核心棋子重合度</b>推荐最契合的阵容（覆盖率越高越贴合你已拿到的牌）。
          </p>
          <div className="cg-chip-grid">
            {CHAMP_POOL.map((c) => (
              <button
                key={c.id}
                className={`cg-chip cost${c.cost || 1} ${owned.includes(c.id) ? 'on' : ''}`}
                onClick={() => toggleOwned(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="cg-actions">
            <button className="btn primary" onClick={() => setFit(computeFit(owned))} disabled={owned.length === 0}>
              🔍 找契合阵容（已选 {owned.length}）
            </button>
            <button className="btn ghost" onClick={() => { setOwned([]); setFit(null); }} disabled={owned.length === 0}>
              ↺ 清空
            </button>
          </div>
          {fit && (
            <div className="cg-fit-results">
              {fit.length === 0 ? (
                <p className="muted">这些棋子暂时没匹配到现成阵容，试试多选几个核心棋子。</p>
              ) : (
                fit.map(({ comp, hit, cov }, i) => (
                  <div className="cg-fit-item" key={comp.compId}>
                    <div className="cg-cov">
                      <span className="cg-cov-num">{Math.round(cov * 100)}%</span>
                      <span className="cg-cov-cap">契合度 · 命中 {hit} 核</span>
                      <span className="cg-cov-bar">
                        <span className="cg-cov-fill" style={{ width: `${Math.round(cov * 100)}%` }} />
                      </span>
                    </div>
                    <CompCard comp={comp} index={i} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
