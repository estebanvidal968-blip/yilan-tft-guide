'use client';

import { useEffect, useState } from 'react';
import IconImg from './IconImg';
import synthPairs from '@/data/synth-pairs.json';
import baseItems from '@/data/items.json';
import itemsTft from '@/data/tft/items.json';
import itemDescZh from '@/data/item-desc-zh.json';
import { SEASON } from '@/lib/season';

const ROUND = 10;
const REWARD = 10;
const PENALTY = 5;

// 散件 id → { name, icon }。data/items.json 已带 OP.GG 官方图标（10/10 全覆盖）。
const COMP_MAP = new Map(
  (baseItems || []).map((c) => [c.itemId, { name: c.name, icon: c.icon || null }]),
);
const compName = (id) => COMP_MAP.get(id)?.name || id;
const compIcon = (id) => COMP_MAP.get(id)?.icon || null;

// 成装名 → 图标（synth-pairs.json 的 toIcon）
const TO_ICON = new Map((synthPairs || []).map((p) => [p.to, p.toIcon || null]));

// OP.GG 全量装备：id → { name, icon }（非纹章，用于「识装」题型）
const TFT_MAP = new Map(
  (itemsTft || []).filter((i) => i.kind !== '纹章').map((i) => [i.id, { name: i.name, icon: i.icon || null }]),
);

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 题型 A：合成 —— 给 2 散件，选成装
function buildSynth(correct) {
  const correctName = correct.to;
  const others = synthPairs.filter((p) => p.to !== correctName).map((p) => p.to);
  const distractors = [];
  while (distractors.length < 3 && others.length > 0) {
    distractors.push(others.splice(Math.floor(Math.random() * others.length), 1)[0]);
  }
  return {
    kind: 'synth',
    fromComps: correct.from.map((id) => ({ id, name: compName(id), icon: compIcon(id) })),
    options: shuffle([correctName, ...distractors]).map((nm) => ({ label: nm, icon: TO_ICON.get(nm) || null })),
    correct: correctName,
  };
}

// 题型 B：拆解 —— 给成装，选由哪两件散件合成
function buildReverse(correct) {
  const others = synthPairs.filter((p) => p.from.join('+') !== correct.from.join('+'));
  const distractors = [];
  while (distractors.length < 3 && others.length > 0) {
    distractors.push(others.splice(Math.floor(Math.random() * others.length), 1)[0]);
  }
  const mk = (p) => ({
    label: p.from.map(compName).join(' + '),
    subIcons: p.from.map(compIcon),
  });
  return {
    kind: 'reverse',
    targetIcon: correct.toIcon || null,
    targetName: correct.to,
    options: shuffle([correct, ...distractors]).map(mk),
    correct: mk(correct).label,
  };
}

// 题型 C：识装 —— 给中文效果描述，选装备
const EFFECT_POOL = Object.keys(itemDescZh)
  .filter((k) => k !== '_meta' && TFT_MAP.has(k))
  .map((k) => ({ id: k, desc: (itemDescZh[k] || '').split('\n')[0] }));

function buildEffect(correct) {
  const correctMeta = TFT_MAP.get(correct.id);
  const others = EFFECT_POOL.filter((e) => e.id !== correct.id).map((e) => e.id);
  const distractors = [];
  while (distractors.length < 3 && others.length > 0) {
    distractors.push(others.splice(Math.floor(Math.random() * others.length), 1)[0]);
  }
  const mk = (id) => {
    const m = TFT_MAP.get(id);
    return { label: m.name, icon: m.icon || null };
  };
  return {
    kind: 'effect',
    prompt: correct.desc,
    options: shuffle([correct.id, ...distractors]).map(mk),
    correct: correctMeta.name,
  };
}

// 三类题池（构建一次，含 Math.random 选项洗牌；运行时在客户端按 seed 重洗）
const SYNTH_Q = synthPairs.map(buildSynth);
const REVERSE_Q = synthPairs.map(buildReverse);
const EFFECT_Q = EFFECT_POOL.map(buildEffect);
const POOLS = [SYNTH_Q, REVERSE_Q, EFFECT_Q];

// 三种题池按比例均衡抽题（保证每轮题型多样）。在客户端按 seed 重洗。
function makeRound() {
  const per = Math.floor(ROUND / POOLS.length);
  const out = [];
  for (const pool of POOLS) out.push(...shuffle(pool).slice(0, per));
  const remain = ROUND - out.length;
  out.push(...shuffle(POOLS.flat()).slice(0, remain));
  return shuffle(out);
}

export default function QuizClient() {
  const [seed, setSeed] = useState(0);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState([]);
  // 题目只在客户端生成，避免 SSR 与 CSR 的首屏不一致
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    setQuestions(makeRound());
  }, [seed]);

  const cur = questions[idx];
  if (!cur) {
    return (
      <div className="quiz-shell">
        <div className="quiz-card">
          <div className="quiz-head"><span className="muted">正在出题…</span></div>
        </div>
      </div>
    );
  }

  function pick(opt) {
    if (picked) return;
    const name = opt.label;
    setPicked(name);
    const right = name === cur.correct;
    setScore((s) => s + (right ? REWARD : -PENALTY));
    setHistory((h) => [...h, { q: cur, picked: name, correct: cur.correct, right }]);
    setTimeout(() => {
      if (idx + 1 < ROUND) {
        setIdx(idx + 1);
        setPicked(null);
      } else {
        setDone(true);
      }
    }, 900);
  }

  function restart() {
    setSeed(seed + 1);
    setIdx(0);
    setScore(0);
    setPicked(null);
    setDone(false);
    setHistory([]);
  }

  const kindLabel = { synth: '合成', reverse: '拆解', effect: '识装' }[cur?.kind] || '';

  return (
    <div className="quiz-shell">
      {!done ? (
        <div className="quiz-card">
          <div className="quiz-head">
            <span className="muted">
              第 {idx + 1} / {ROUND} 题 · <b className="quiz-kind">{kindLabel}</b> · 答对 +{REWARD} / 答错 {PENALTY}
            </span>
            <span className="quiz-score">总分 <b>{score}</b></span>
          </div>

          {/* 题干区 */}
          {cur.kind === 'synth' && (
            <div className="quiz-from">
              <p className="muted" style={{ marginBottom: 12 }}>下面两件散件可以合成：</p>
              <div className="quiz-from-row">
                {cur.fromComps.map((f, i) => (
                  <div key={f.id + '-' + i} className="quiz-from-item">
                    <IconImg src={f.icon} alt={f.name} fallback={(f.name || '').slice(0, 1)} className="quiz-from-ic" />
                    <span>{f.name}</span>
                  </div>
                ))}
                <span className="quiz-plus">+</span>
              </div>
            </div>
          )}
          {cur.kind === 'reverse' && (
            <div className="quiz-from">
              <p className="muted" style={{ marginBottom: 12 }}>这件装备由哪两件散件合成：</p>
              <div className="quiz-from-row">
                <div className="quiz-from-item">
                  <IconImg src={cur.targetIcon} alt={cur.targetName} fallback={(cur.targetName || '').slice(0, 1)} className="quiz-from-ic" />
                  <span>{cur.targetName}</span>
                </div>
              </div>
            </div>
          )}
          {cur.kind === 'effect' && (
            <div className="quiz-prompt">
              <p className="muted" style={{ marginBottom: 12 }}>这段装备效果来自哪件装备：</p>
              <div className="quiz-prompt-box">{cur.prompt}</div>
            </div>
          )}

          {/* 选项区 */}
          <div className="quiz-options">
            {cur.options.map((o, i) => {
              const isCorrect = picked && o.label === cur.correct;
              const isWrong = picked === o.label && o.label !== cur.correct;
              return (
                <button
                  key={o.label + '-' + i}
                  className={`quiz-op ${isCorrect ? 'ok' : ''} ${isWrong ? 'bad' : ''}`}
                  disabled={!!picked}
                  onClick={() => pick(o)}
                >
                  {o.icon ? (
                    <IconImg src={o.icon} alt={o.label} fallback={(o.label || '').slice(0, 1)} className="quiz-op-ic" />
                  ) : o.subIcons ? (
                    <span className="quiz-op-subs">
                      <IconImg src={o.subIcons[0]} alt="" fallback="·" className="quiz-sub-ic" />
                      <IconImg src={o.subIcons[1]} alt="" fallback="·" className="quiz-sub-ic" />
                    </span>
                  ) : null}
                  <span>{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <Result score={score} history={history} onRestart={restart} />
      )}
    </div>
  );
}

function Result({ score, history, onRestart }) {
  const right = history.filter((h) => h.right).length;
  const total = history.length || 1;
  const accuracy = Math.round((right / total) * 100);
  const rankText =
    score >= 80 ? '装备大师' : score >= 50 ? '基础过关' : '仍需努力';
  const shareUrl =
    (typeof window !== 'undefined' ? window.location.origin : '') + '/tools/quiz';
  const [copied, setCopied] = useState(false);

  function copyScore() {
    const text = `我在弈览 S${SEASON.no} 装备小测得 ${score} 分（答对 ${right}/${total}，正确率 ${accuracy}%）· ${rankText}！来挑战 → ${shareUrl}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
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
    const H = 760;
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    // 背景 + 金边
    x.fillStyle = '#F4F1EA';
    x.fillRect(0, 0, W, H);
    x.strokeStyle = '#9C7C3C';
    x.lineWidth = 4;
    x.strokeRect(16, 16, W - 32, H - 32);
    x.textAlign = 'center';
    // 标题
    x.fillStyle = '#1B1916';
    x.font = '600 34px "Noto Serif SC", serif';
    x.fillText('弈览 · 金铲铲 S' + SEASON.no, W / 2, 92);
    x.fillStyle = '#8C867A';
    x.font = '500 22px sans-serif';
    x.fillText('装备合成速记小测', W / 2, 130);
    // 总分
    x.fillStyle = '#1B1916';
    x.font = '700 120px sans-serif';
    x.fillText(String(score), W / 2, 330);
    x.fillStyle = '#8C867A';
    x.font = '500 20px sans-serif';
    x.fillText('总分', W / 2, 370);
    // 明细
    x.fillStyle = '#1B1916';
    x.font = '600 26px sans-serif';
    x.fillText(`答对 ${right} / ${total} · 正确率 ${accuracy}%`, W / 2, 450);
    x.fillStyle = '#9C7C3C';
    x.font = '600 30px "Noto Serif SC", serif';
    x.fillText(rankText, W / 2, 512);
    // 底部链接
    x.fillStyle = '#8C867A';
    x.font = '400 18px sans-serif';
    x.fillText('来挑战 → ' + shareUrl, W / 2, H - 48);
    c.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '弈览装备小测成绩.png';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  return (
    <div className="quiz-result">
      <div className="share-card">
        <div className="share-card-top">
          <span className="share-brand">弈览 · 金铲铲 S{SEASON.no}</span>
          <span className="share-sub">装备合成速记小测</span>
        </div>
        <div className="share-score">{score}</div>
        <div className="share-score-cap">总分</div>
        <div className="share-line">
          答对 <b>{right} / {total}</b> · 正确率 <b>{accuracy}%</b>
        </div>
        <div className="share-rank">{rankText}</div>
      </div>

      <p className="muted" style={{ margin: '4px 0 16px' }}>
        {score >= 80 ? '🔥 装备大师级别，合成路径全在脑子里。' :
         score >= 50 ? '👍 基础过关，多打几局强化肌肉记忆。' :
         '💪 建议翻翻装备库，合成路径熟了再来。'}
      </p>

      <div className="share-actions">
        <button className="share-btn" onClick={copyScore}>
          {copied ? '✓ 已复制' : '📋 复制成绩+链接'}
        </button>
        <button className="share-btn ghost" onClick={saveImage}>
          🖼️ 保存分享图
        </button>
      </div>

      <button className="btn" onClick={onRestart} style={{ marginTop: 14 }}>
        ↺ 再来 10 题
      </button>
    </div>
  );
}
