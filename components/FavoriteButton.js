'use client';

import { useState, useEffect, useRef } from 'react';
import { toggleFav, isFav } from '@/lib/storage';

export default function FavoriteButton({ type, id }) {
  const [on, setOn] = useState(false);
  const [pulse, setPulse] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    setOn(isFav(type, id));
  }, [type, id]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const click = () => {
    const next = toggleFav(type, id);
    setOn(next);
    // 仅在「收藏成功」时给一次金环脉冲，取消收藏不庆祝
    if (next) {
      setPulse(false);
      requestAnimationFrame(() => setPulse(true));
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setPulse(false), 640);
    }
  };

  const cls = ['btn', on ? 'btn-gold' : '', pulse ? 'btn-pulse' : ''].filter(Boolean).join(' ');

  return (
    <button type="button" className={cls} onClick={click} aria-pressed={on}>
      {on ? '已收藏' : '收藏'}
    </button>
  );
}
