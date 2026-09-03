'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import IconImg from './IconImg';
import icons from '@/data/icons.json';

const STORAGE_KEY = 'yilan:vote:week-2026-W36';

function loadVotes() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function saveVotes(v) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
}

export default function VoteClient({ comps }) {
  const [votes, setVotes] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setVotes(loadVotes());
    setMounted(true);
  }, []);

  const total = Object.values(votes).reduce((a, b) => a + b, 0);

  const ranked = useMemo(() => {
    return [...comps]
      .map((c) => ({
        ...c,
        voteCount: votes[c.compId] || 0,
      }))
      .sort((a, b) => b.voteCount - a.voteCount);
  }, [comps, votes]);

  function vote(compId) {
    const next = { ...votes };
    // 同一浏览器只能投一票：若已投了同一项则撤销，否则切换到新项
    const prev = Object.keys(next).find((k) => next[k] > 0);
    if (prev === compId) {
      delete next[compId];
    } else {
      // 清除旧票，投新票
      Object.keys(next).forEach((k) => (next[k] = 0));
      next[compId] = (next[compId] || 0) + 1;
    }
    setVotes(next);
    saveVotes(next);
  }

  return (
    <div className="vote-shell">
      <div className="vote-summary">
        <span className="muted">本周（2026-W36）· 你在本机已投</span>
        <strong className="vote-total">{total}</strong>
        <span className="muted">票 · 每台设备 1 票，记录只存在你的浏览器</span>
      </div>
      <p className="muted vote-note">
        弈览暂未接入账号系统，票数不联网统计；右侧 OP 分是 OP.GG 强度参考，可对照着投。
      </p>

      <ul className="vote-list">
        {ranked.map((c) => {
          const pct = total > 0 ? ((c.voteCount / total) * 100).toFixed(1) : 0;
          const isMine = mounted && votes[c.compId] > 0;
          return (
            <li key={c.compId} className={`vote-row ${isMine ? 'is-mine' : ''}`}>
              <div className="vote-info">
                <div className="vote-name">{c.name}</div>
                <div className="vote-traits">
                  {c.traits?.slice(0, 4).map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
              <div className="vote-bar-wrap" aria-hidden>
                <div className="vote-bar" style={{ width: `${pct}%` }} />
              </div>
              <div className="vote-actions">
                <span className="vote-op">OP {c.stat?.opScore?.toFixed(2) ?? '—'}</span>
                <span className="vote-count">{c.voteCount}</span>
                <button className={`vote-btn ${isMine ? 'on' : ''}`} onClick={() => vote(c.compId)}>
                  {isMine ? '✓ 已投' : '投一票'}
                </button>
              </div>
              <Link href={`/comp/${c.compId}`} className="vote-detail">看攻略 →</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}