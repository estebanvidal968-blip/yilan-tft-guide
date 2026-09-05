'use client';

import { useState, useEffect } from 'react';

// 阵容攻略统一模板 + 新手/宗师双入口。
// 新手：阵容码（抄作业核心）+ 一句话点评 + 上手 3 步 + 核心装备。
// 宗师：阵容码 + 选取思路·符文搭配 + 选子技巧 + 运营节奏 + 克制关系 + 站位提示。
// 难度选择持久化到 localStorage，跨阵容保持一致，提升留存。
export default function CompGuide({ comp }) {
  const [mode, setMode] = useState('beginner');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('yilan-level');
      if (saved === 'beginner' || saved === 'master') setMode(saved);
    } catch {}
  }, []);

  const switchMode = (m) => {
    setMode(m);
    try { localStorage.setItem('yilan-level', m); } catch {}
  };

  const core =
    (comp.coreChampions && comp.coreChampions.length)
      ? comp.coreChampions
      : (comp.positions || []).filter((p) => p.carry).map((p) => p.champ);
  const items = comp.coreItems || [];
  const traits = comp.traits || [];
  const code = comp.compCodeShort || comp.compCode || '';

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className="comp-guide enter">
      <div className="lv-toggle" role="tablist" aria-label="阅读难度">
        <button
          className={`lv-seg ${mode === 'beginner' ? 'on' : ''}`}
          onClick={() => switchMode('beginner')}
          aria-pressed={mode === 'beginner'}
        >
          新手 · 抄作业
        </button>
        <button
          className={`lv-seg ${mode === 'master' ? 'on' : ''}`}
          onClick={() => switchMode('master')}
          aria-pressed={mode === 'master'}
        >
          宗师 · 看运营
        </button>
      </div>

      {/* 阵容码：两种模式都给，抄作业核心 */}
      <div className="panel">
        <h3>阵容码</h3>
        <div className="code-block">
          <code>{code || '（游戏内暂未生成）'}</code>
          <button className="btn btn-gold sm" onClick={copyCode} disabled={!code}>
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        {comp.compCode && mode === 'master' && (
          <details className="code-detail">
            <summary>查看完整站位码</summary>
            <pre>{comp.compCode}</pre>
          </details>
        )}
      </div>

      {mode === 'beginner' ? (
        <>
          <div className="panel">
            <h3>一句话点评</h3>
            <p>{comp.aiComment || '—'}</p>
          </div>
          <div className="panel">
            <h3>上手 3 步</h3>
            <ol className="guide-steps">
              <li>
                <span className="step-no">1</span>
                <div className="step-text">
                  <b>抢 C 位：</b>
                  {core.join('、') || '—'}，优先追二星。
                </div>
              </li>
              <li>
                <span className="step-no">2</span>
                <div className="step-text">
                  <b>做核心装备：</b>
                  {items.length ? items.join('、') : '按阵容常规出装'}
                </div>
              </li>
              <li>
                <span className="step-no">3</span>
                <div className="step-text">
                  <b>凑羁绊升人口：</b>
                  {traits.join('、') || '—'}
                </div>
              </li>
            </ol>
          </div>
          {items.length > 0 && (
            <div className="panel">
              <h3>核心装备</h3>
              <div className="kv">
                {items.map((i) => (
                  <span key={i} className="tag">
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {comp.selectionGuide && (
            <div className="panel">
              <h3>阵容选取 · 符文搭配</h3>
              <p>{comp.selectionGuide}</p>
            </div>
          )}
          {comp.pickTips && (
            <div className="panel">
              <h3>选奕子小技巧</h3>
              <p>{comp.pickTips}</p>
            </div>
          )}
          {comp.earlyGame || comp.midGame || comp.lateGame ? (
            <div className="panel">
              <h3>运营节奏</h3>
              {comp.earlyGame && <p>前期：{comp.earlyGame}</p>}
              {comp.midGame && <p>中期：{comp.midGame}</p>}
              {comp.lateGame && <p>后期：{comp.lateGame}</p>}
            </div>
          ) : null}
          {comp.counters?.length || comp.counteredBy?.length ? (
            <div className="panel">
              <h3>克制关系</h3>
              <p>克制：{comp.counters?.length ? comp.counters.join('、') : '—'}</p>
              <p>被克：{comp.counteredBy?.length ? comp.counteredBy.join('、') : '—'}</p>
            </div>
          ) : null}
          {comp.positionTip && (
            <div className="panel">
              <h3>站位提示</h3>
              <p>{comp.positionTip}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
