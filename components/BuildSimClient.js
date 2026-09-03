'use client';

import { useState, useMemo } from 'react';
import IconImg from './IconImg';
import champs from '@/data/tft/champs.json';
import itemsTft from '@/data/tft/items.json';
import { SEASON } from '@/lib/season';

// 注意：不要从 @/lib/tftData 引入——它顶层 import node:fs，在客户端打包会失败。
// 这里只用纯展示逻辑 + 本地数据 JSON。
const pct = (v) => {
  const n = (Number(v) || 0) * 100;
  return (n >= 10 ? n.toFixed(0) : n.toFixed(1)) + '%';
};

const ITEM_POOL = itemsTft || [];
const ITEM_MAP = new Map(ITEM_POOL.map((i) => [i.id, i]));
const CHAMP_MAP = new Map(champs.map((c) => [c.id, c]));

// 弈子按费用分组，供下拉选择
const CHAMP_BY_COST = [1, 2, 3, 4, 5].map((cost) => ({
  cost,
  list: champs
    .filter((c) => c.cost === cost)
    .sort((a, b) => a.name.localeCompare(b.name, 'zh')),
}));

const norm = (arr) => [...arr].sort().join('|');

// 判定：命中 topBuilds 看 delta；命中 worstBuilds 直接判陷阱
function judge(delta, inTop) {
  if (!inTop) return { label: '版本陷阱', emoji: '⚠️', tone: 'bad' };
  if (delta >= 2.2) return { label: '版本奇效', emoji: '🔥', tone: 'hot' };
  if (delta >= 1.6) return { label: '强势出装', emoji: '💪', tone: 'good' };
  if (delta >= 1.0) return { label: '稳健可用', emoji: '✅', tone: 'ok' };
  return { label: '中庸搭配', emoji: '😐', tone: 'mid' };
}

// 0-99 趣味评分：delta 越大越高（delta 2.5≈95，0≈50，负→0）
const buildScore = (delta) => Math.max(0, Math.min(99, Math.round(50 + delta * 18)));

function analyze(champId, picked) {
  const champ = CHAMP_MAP.get(champId);
  if (!champ) return null;
  const key = norm(picked);
  const top = champ.topBuilds || [];
  const worst = champ.worstBuilds || [];
  const exactTop = top.find((b) => norm(b.items) === key) || null;
  const exactWorst = worst.find((b) => norm(b.items) === key) || null;
  const partials = top
    .map((b) => ({ b, shared: b.items.filter((i) => picked.includes(i)).length }))
    .filter((x) => x.shared >= 2)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 3);
  return { champ, exactTop, exactWorst, partials, topCount: top.length };
}

export default function BuildSimClient() {
  const [champId, setChampId] = useState('');
  const [slots, setSlots] = useState([null, null, null]); // 3 个装备槽
  const [q, setQ] = useState('');
  const [result, setResult] = useState(null);

  const filteredItems = useMemo(() => {
    const t = q.trim();
    const list = t
      ? ITEM_POOL.filter((i) => i.name.includes(t) || (i.key || '').toLowerCase().includes(t.toLowerCase()))
      : ITEM_POOL;
    return list;
  }, [q]);

  const champ = champId ? CHAMP_MAP.get(champId) : null;
  const filled = slots.filter(Boolean).length;
  const canAnalyze = champ && filled === 3;

  function addItem(id) {
    setSlots((s) => {
      if (s.includes(id)) return s; // 不可重复
      const idx = s.indexOf(null);
      if (idx === -1) return s; // 已满
      const next = [...s];
      next[idx] = id;
      return next;
    });
  }
  function clearSlot(i) {
    setSlots((s) => {
      const next = [...s];
      next[i] = null;
      return next;
    });
  }

  function run() {
    if (!canAnalyze) return;
    setResult(analyze(champId, slots.filter(Boolean)));
  }
  function reset() {
    setSlots([null, null, null]);
    setResult(null);
  }

  return (
    <div className="build-sim">
      {/* 步骤 1：选弈子 */}
      <section className="bs-step">
        <div className="bs-step-head">
          <span className="bs-num">1</span>
          <h3>选弈子</h3>
        </div>
        <div className="bs-champ-pick">
          <select
            className="bs-select"
            value={champId}
            onChange={(e) => {
              setChampId(e.target.value);
              setResult(null);
            }}
          >
            <option value="">— 选择要试装的弈子 —</option>
            {CHAMP_BY_COST.map((g) => (
              <optgroup key={g.cost} label={`${g.cost} 费`}>
                {g.list.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {champ && (
            <span className={`unit-token ut-md cost${champ.cost || 1} bs-champ-token`}>
              <IconImg src={champ.icon} alt={champ.name} fallback={champ.name.slice(0, 1)} />
            </span>
          )}
        </div>
      </section>

      {/* 步骤 2：选 3 件装备 */}
      <section className="bs-step">
        <div className="bs-step-head">
          <span className="bs-num">2</span>
          <h3>选 3 件装备（点图标加入，点槽位移除）</h3>
        </div>
        <div className="bs-slots">
          {slots.map((id, i) => {
            const it = id ? ITEM_MAP.get(id) : null;
            return (
              <button
                key={i}
                className={`bs-slot ${it ? 'filled' : 'empty'}`}
                onClick={() => it && clearSlot(i)}
                disabled={!it}
                title={it ? `移除 ${it.name}` : `第 ${i + 1} 槽`}
              >
                {it ? (
                  <>
                    <IconImg src={it.icon} alt={it.name} fallback={it.name.slice(0, 1)} className="bs-slot-ic" circle={false} />
                    <span className="bs-slot-name">{it.name}</span>
                  </>
                ) : (
                  <span className="bs-slot-ph">＋ 第 {i + 1} 件</span>
                )}
              </button>
            );
          })}
        </div>
        <input
          className="bs-search"
          placeholder="搜索装备名（如 法爆 / 饮血）…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="bs-item-grid">
          {filteredItems.map((it) => {
            const picked = slots.includes(it.id);
            return (
              <button
                key={it.id}
                className={`bs-item ${picked ? 'picked' : ''}`}
                onClick={() => addItem(it.id)}
                disabled={picked}
                title={it.name}
              >
                <IconImg src={it.icon} alt={it.name} fallback={it.name.slice(0, 1)} className="bs-item-ic" circle={false} />
                <span className="bs-item-name">{it.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 步骤 3：分析 */}
      <section className="bs-step">
        <div className="bs-actions">
          <button className="btn primary" onClick={run} disabled={!canAnalyze}>
            ⚔️ 分析这套出装
          </button>
          <button className="btn ghost" onClick={reset} disabled={!champ && filled === 0}>
            ↺ 清空
          </button>
          {!canAnalyze && (
            <span className="muted bs-hint">
              {!champ ? '先选弈子' : `还需选 ${3 - filled} 件装备`}
            </span>
          )}
        </div>
      </section>

      {/* 结果 */}
      {result && <ResultView result={result} slots={slots} />}
    </div>
  );
}

function ResultView({ result, slots }) {
  const { champ, exactTop, exactWorst, partials, topCount } = result;
  const pickedItems = slots.filter(Boolean).map((id) => ITEM_MAP.get(id)).filter(Boolean);
  const score = buildScore(exactTop ? exactTop.delta : exactWorst ? exactWorst.delta : 0);
  const j = exactTop
    ? judge(exactTop.delta, true)
    : exactWorst
    ? judge(exactWorst.delta, false)
    : null;
  const [copied, setCopied] = useState(false);

  const shareUrl = (typeof window !== 'undefined' ? window.location.origin : '') + '/tools/build-sim';

  function copyScore() {
    const txt = `我在弈览 S${SEASON.no} 出装模拟器试了【${champ.name} + ${pickedItems.map((i) => i.name).join('/')}】→ ${j ? j.emoji + j.label : '样本不足'}，评分 ${score}！来试试你的奇效出装 → ${shareUrl}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        },
        () => setCopied(false),
      );
    }
  }

  function saveImage() {
    const c = document.createElement('canvas');
    const W = 600;
    const H = 720;
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = '#F4F1EA';
    x.fillRect(0, 0, W, H);
    x.strokeStyle = '#9C7C3C';
    x.lineWidth = 4;
    x.strokeRect(16, 16, W - 32, H - 32);
    x.textAlign = 'center';
    x.fillStyle = '#1B1916';
    x.font = '600 32px "Noto Serif SC", serif';
    x.fillText('弈览 · 金铲铲 S' + SEASON.no, W / 2, 92);
    x.fillStyle = '#8C867A';
    x.font = '500 22px sans-serif';
    x.fillText('出装模拟器 · 真实对局数据', W / 2, 130);
    x.fillStyle = '#1B1916';
    x.font = '700 38px sans-serif';
    x.fillText(champ.name, W / 2, 200);
    x.font = '500 22px sans-serif';
    x.fillText(pickedItems.map((i) => i.name).join(' + '), W / 2, 244);
    x.fillStyle = j ? '#9C7C3C' : '#8C867A';
    x.font = '700 40px "Noto Serif SC", serif';
    x.fillText(j ? j.emoji + ' ' + j.label : '样本不足', W / 2, 330);
    x.fillStyle = '#1B1916';
    x.font = '700 96px sans-serif';
    x.fillText(String(score), W / 2, 460);
    x.fillStyle = '#8C867A';
    x.font = '500 20px sans-serif';
    x.fillText('出装评分', W / 2, 498);
    if (exactTop) {
      x.fillStyle = '#1B1916';
      x.font = '600 24px sans-serif';
      x.fillText(`胜率 ${pct(exactTop.winRate)} · 前四 ${pct(exactTop.top4Rate)}`, W / 2, 556);
    }
    x.fillStyle = '#8C867A';
    x.font = '400 18px sans-serif';
    x.fillText('来试你的奇效出装 → ' + shareUrl, W / 2, H - 48);
    c.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '弈览出装模拟器.png';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  // 没有精确命中
  if (!exactTop && !exactWorst) {
    const best = champ.topBuilds?.[0];
    return (
      <div className="bs-result">
        <div className="bs-verdict tone-mid">
          <span className="bs-verdict-emoji">🔍</span>
          <div>
            <b>这套出装在 OP.GG 样本里没出现</b>
            <p className="muted">可能太冷门或样本不足。先看看 {champ.name} 当前最猛的搭配：</p>
          </div>
        </div>
        {best && (
          <div className="bs-suggest">
            <span className="bs-suggest-label">版本最强</span>
            <div className="bs-suggest-items">
              {best.items.map((id, i) => {
                const it = ITEM_MAP.get(id);
                return it ? (
                  <span key={id} className="bs-suggest-item">
                    <IconImg src={it.icon} alt={it.name} fallback={it.name.slice(0, 1)} className="bs-item-ic" circle={false} />
                    {it.name}
                  </span>
                ) : null;
              })}
            </div>
            <span className="bs-suggest-stat">
              胜率 {pct(best.winRate)} · 前四 {pct(best.top4Rate)} · Δ{best.delta.toFixed(2)}
            </span>
          </div>
        )}
        {partials.length > 0 && (
          <div className="bs-partials">
            <p className="bs-partials-title">这几套和你选的很接近：</p>
            {partials.map(({ b, shared }) => (
              <PartialRow key={b.items.join('|')} b={b} picked={pickedItems} shared={shared} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const b = exactTop || exactWorst;
  const rankNo = exactTop ? result.topCount - (champ.topBuilds.indexOf(b)) : null;
  const toneClass = `tone-${j.tone}`;

  return (
    <div className="bs-result">
      <div className={`bs-verdict ${toneClass}`}>
        <span className="bs-verdict-emoji">{j.emoji}</span>
        <div>
          <b>{j.label}</b>
          <p className="muted">
            {exactTop
              ? `在 ${champ.name} 的 ${topCount} 套出装里排第 ${rankNo}，全服 ${b.n?.toLocaleString('zh-CN') || '?'} 场样本。`
              : `踩中 ${champ.name} 的弱势搭配，样本 ${b.n?.toLocaleString('zh-CN') || '?'} 场，慎选。`}
          </p>
        </div>
      </div>

      <div className="bs-stats">
        <div className="bs-stat">
          <i>胜率</i>
          <b>{pct(b.winRate)}</b>
        </div>
        <div className="bs-stat">
          <i>前四率</i>
          <b>{pct(b.top4Rate)}</b>
        </div>
        <div className="bs-stat">
          <i>平均名次</i>
          <b>{b.delta?.toFixed?.(2)} Δ</b>
        </div>
        <div className="bs-stat">
          <i>出装评分</i>
          <b className="bs-score">{score}</b>
        </div>
      </div>

      <div className="share-card bs-share">
        <div className="share-card-top">
          <span className="share-brand">弈览 · 金铲铲 S{SEASON.no}</span>
          <span className="share-sub">出装模拟器</span>
        </div>
        <div className="bs-share-champ">
          <IconImg src={champ.icon} alt={champ.name} fallback={champ.name.slice(0, 1)} className="bs-share-ic" />
          <b>{champ.name}</b>
        </div>
        <div className="bs-share-items">
          {pickedItems.map((it) => (
            <span key={it.id} className="bs-share-item">
              <IconImg src={it.icon} alt={it.name} fallback={it.name.slice(0, 1)} className="bs-item-ic" circle={false} />
              {it.name}
            </span>
          ))}
        </div>
        <div className={`share-rank ${toneClass}`}>
          {j.emoji} {j.label} · 评分 {score}
        </div>
      </div>

      <div className="share-actions">
        <button className="share-btn" onClick={copyScore}>
          {copied ? '✓ 已复制' : '📋 复制成绩+链接'}
        </button>
        <button className="share-btn ghost" onClick={saveImage}>
          🖼️ 保存分享图
        </button>
      </div>
    </div>
  );
}

function PartialRow({ b, picked, shared }) {
  const itMap = ITEM_MAP;
  return (
    <div className="bs-partial-row">
      <div className="bs-partial-items">
        {b.items.map((id) => {
          const it = itMap.get(id);
          const inPick = picked.some((p) => p.id === id);
          return it ? (
            <span key={id} className={`bs-partial-item ${inPick ? 'hit' : 'miss'}`}>
              <IconImg src={it.icon} alt={it.name} fallback={it.name.slice(0, 1)} className="bs-item-ic" circle={false} />
              {it.name}
            </span>
          ) : null;
        })}
      </div>
      <span className="bs-partial-stat">
        {shared}/3 重合 · 胜率 {pct(b.winRate)} · Δ{b.delta.toFixed(2)}
      </span>
    </div>
  );
}
