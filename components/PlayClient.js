'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import IconImg from './IconImg';
import icons from '@/data/icons.json';
import { translateOpScore, formatWinRate, formatAvgPlacement } from '@/lib/opScore';

// 10 套 T0 阵容的三维标签（物理/法术/坦克、速攻/中后期/弹性、稳/激进/黑科技）。
// 基于 comps.opgg.json 的 coreItems / traits / selectionGuide 人工标注。
// 注意：必须定义在客户端组件内部 —— 函数不能作为 prop 从 Server Component 传进 Client Component。
const COMP_META = {
  guardian_cassiopeia: { damage: 'ap', pace: 'late', style: 'safe' },
  soul_lotus_ahri: { damage: 'ap', pace: 'late', style: 'safe' },
  eternal_draven: { damage: 'ad', pace: 'early', style: 'aggressive' },
  morph_yi: { damage: 'mix', pace: 'early', style: 'trick' },
  mage_ahri: { damage: 'ap', pace: 'late', style: 'trick' },
  rapid_kayle: { damage: 'tank', pace: 'flex', style: 'safe' },
  heavy_morgana: { damage: 'ap', pace: 'late', style: 'safe' },
  eternal_aphelios: { damage: 'ad', pace: 'early', style: 'safe' },
  yordle_veigar: { damage: 'tank', pace: 'late', style: 'trick' },
  wilds_elderdragon: { damage: 'tank', pace: 'flex', style: 'safe' },
};

function mapCompById(compId) {
  return COMP_META[compId] || { damage: 'mix', pace: 'flex', style: 'safe' };
}

const QUESTIONS = [
  {
    key: 'damage',
    label: '核心伤害类型',
    sub: '你想用哪种伤害流派？',
    options: [
      { id: 'ad', label: '🗡️ 物理（AD）', sub: '暴击 / 攻速 / 破甲' },
      { id: 'ap', label: '🔮 法术（AP）', sub: '法强 / 法穿 / 持续伤害' },
      { id: 'tank', label: '🛡️ 坦克（前排肉装）', sub: '扛伤 / 反伤 / 控场' },
      { id: 'mix', label: '🌊 混合 / 灵活', sub: '不挑，吃到什么用什么' },
    ],
  },
  {
    key: 'pace',
    label: '运营节奏',
    sub: '你的经济/血线更适合什么节奏？',
    options: [
      { id: 'early', label: '⚡ 速攻（前中期决胜）', sub: '4-1 前要成型 / 暴击堆' },
      { id: 'late', label: '🧠 中后期（大核成型）', sub: '攒经济 / 叠被动 / AP 法师' },
      { id: 'flex', label: '🎯 任意节奏都行', sub: '不挑，看牌走' },
    ],
  },
  {
    key: 'style',
    label: '打法风格',
    sub: '你偏好哪种操作感？',
    options: [
      { id: 'safe', label: '🏰 稳健（多羁绊保护）', sub: '容错高 / 护卫 / 多前排' },
      { id: 'aggressive', label: '🔥 激进（速战速决）', sub: '高攻速 / 暴击 / 走脸' },
      { id: 'trick', label: '♟️ 黑科技（特殊机制）', sub: '单卡专属 / 独特羁绊 / 套路' },
    ],
  },
];

function score(comp, answers) {
  const meta = mapCompById(comp.compId);
  let s = 0;
  if (answers.damage && meta.damage === answers.damage) s += 1.0;
  else if (answers.damage === 'mix') s += 0.5;
  if (answers.pace && meta.pace === answers.pace) s += 1.0;
  else if (answers.pace === 'flex') s += 0.5;
  if (answers.style && meta.style === answers.style) s += 1.0;
  // 加权 opScore：归一化到 0~0.6 作为 tie-breaker（不会压过维度匹配）
  const ts = translateOpScore(comp.stat?.opScore);
  s += ts ? ts.norm * 0.6 : 0;
  return s;
}

export default function PlayClient({ comps }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const cur = QUESTIONS[step];
  const allAnswered = QUESTIONS.every((q) => answers[q.key]);

  const ranked = useMemo(() => {
    if (!done) return [];
    return [...comps]
      .map((c) => ({ c, s: score(c, answers) }))
      .sort((a, b) => b.s - a.s);
  }, [comps, answers, done]);

  function pick(key, id) {
    const next = { ...answers, [key]: id };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  }

  function reset() {
    setAnswers({});
    setStep(0);
    setDone(false);
  }

  return (
    <div className="play-shell">
      {/* 步骤指示 */}
      <div className="play-steps">
        {QUESTIONS.map((q, i) => (
          <div key={q.key} className={`play-step ${i === step && !done ? 'on' : ''} ${answers[q.key] ? 'done' : ''}`}>
            <span className="ps-no">{i + 1}</span>
            <span className="ps-label">{q.label}</span>
          </div>
        ))}
      </div>

      {!done ? (
        <div className="play-card">
          <div className="play-q-head">
            <h3>{cur.label}</h3>
            <p>{cur.sub}</p>
          </div>
          <div className="play-options">
            {cur.options.map((o) => (
              <button
                key={o.id}
                className={`play-op ${answers[cur.key] === o.id ? 'is-on' : ''}`}
                onClick={() => pick(cur.key, o.id)}
              >
                <span className="po-label">{o.label}</span>
                <span className="po-sub">{o.sub}</span>
              </button>
            ))}
          </div>
          <div className="play-foot">
            {step > 0 ? (
              <button className="btn-ghost" onClick={() => setStep(step - 1)}>← 上一步</button>
            ) : <span />}
            <span className="muted">{step + 1} / {QUESTIONS.length}</span>
          </div>
        </div>
      ) : (
        <Results ranked={ranked} answers={answers} onReset={reset} />
      )}
    </div>
  );
}

function Results({ ranked, answers, onReset }) {
  const top3 = ranked.slice(0, 3);
  return (
    <div className="play-results">
      <div className="play-result-head">
        <h3>为你推荐 Top 3</h3>
        <button className="btn-ghost" onClick={onReset}>↺ 重选</button>
      </div>
      <div className="comp-grid home-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', maxWidth: 'none' }}>
        {top3.map(({ c, s }, i) => <ResultCard key={c.compId} comp={c} rank={i + 1} score={s} />)}
      </div>

      <details className="play-others">
        <summary>看其余 7 套 · 展开</summary>
        <div className="comp-grid home-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', maxWidth: 'none', marginTop: 18 }}>
          {ranked.slice(3).map(({ c, s }, i) => <ResultCard key={c.compId} comp={c} rank={i + 4} score={s} />)}
        </div>
      </details>
    </div>
  );
}

function ResultCard({ comp, rank, score }) {
  const carry = comp.positions?.find((p) => p.carry);
  const ts = translateOpScore(comp.stat?.opScore);
  const matchPct = Math.round((score / 2.6) * 100); // 满分 2.6（3 维度 × 1 + 0.6 强度）
  return (
    <article className="comp-card enter play-result-card" style={{ animationDelay: `${rank * 70}ms` }}>
      <div className="cc-head">
        <div className="cc-head-l">
          <span className={`cc-rank${rank <= 3 ? ' top' + rank : ''}`}><i>#</i>{rank}</span>
          <span className="cc-name">{comp.name}</span>
        </div>
        <span className="play-match-pct">匹配度 {matchPct}%</span>
      </div>

      {ts ? (
        <div className="cc-stats">
          <span className="cc-stat"><i>预估胜率</i><b>{formatWinRate(ts.winRate)}</b></span>
          <span className="cc-stat"><i>平均名次</i><b>{formatAvgPlacement(ts.avgPlacement)}</b></span>
        </div>
      ) : null}

      <div className="cc-traits">
        {comp.traits.slice(0, 5).map((t) => <span key={t} className="tag">{t}</span>)}
      </div>

      {carry ? (
        <div className="cc-carry">
          <span className="cc-carry-lead">
            <span className="unit-token ut-sm"><IconImg src={icons.champion?.[carry.champ]} alt={carry.champ} fallback={(carry.champ || '').slice(0, 1)} /></span>
            C 位 <strong>{carry.champ}</strong>
          </span>
        </div>
      ) : null}

      <p className="cc-comment">{comp.aiComment?.slice(0, 90)}…</p>

      <div className="cc-actions">
        <Link href={`/comp/${comp.compId}`} className="btn">查看攻略 →</Link>
      </div>
    </article>
  );
}