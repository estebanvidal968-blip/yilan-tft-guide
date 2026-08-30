'use client';

import { useState, useEffect, useRef } from 'react';
import { isLiked, toggleLike } from '@/lib/storage';

export default function LikeButton({ compId }) {
  const [count, setCount] = useState(null);
  const [liked, setLiked] = useState(false);
  const [pulse, setPulse] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    setLiked(isLiked(compId));
    fetch(`/api/like?compId=${encodeURIComponent(compId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setCount(d.count);
      })
      .catch(() => {});
    return () => clearTimeout(timer.current);
  }, [compId]);

  const click = async () => {
    const willLike = !liked;
    // 乐观更新：先本地态 + 计数，再落库
    setLiked(willLike);
    setCount((c) => (c == null ? c : Math.max(0, c + (willLike ? 1 : -1))));
    if (willLike) {
      setPulse(false);
      requestAnimationFrame(() => setPulse(true));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setPulse(false), 640);
    }
    toggleLike(compId); // 本地记录「我是否赞过」
    try {
      const r = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compId, delta: willLike ? 1 : -1 }),
      });
      const d = await r.json();
      if (d.ok) setCount(d.count);
    } catch {
      /* 网络失败保留乐观值，下次进入会重新对齐 */
    }
  };

  const cls = ['like-btn', liked ? 'is-on' : '', pulse ? 'like-pulse' : ''].filter(Boolean).join(' ');

  return (
    <button type="button" className={cls} onClick={click} aria-pressed={liked} aria-label="点赞">
      <span className="like-heart">♥</span>
      <span>{liked ? '已赞' : '赞'}</span>
      {count != null && <span className="like-count">{count}</span>}
    </button>
  );
}
