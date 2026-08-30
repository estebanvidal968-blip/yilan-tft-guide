'use client';

import { useState } from 'react';

/**
 * 可优雅降级的图标：
 * - 加载成功 → 渲染 <img>（可圆形裁剪）
 * - 加载失败或无 src → 回退为文字首字（避免破图）
 * 用于英雄头像、装备图标等外链 CDN 场景。
 */
export default function IconImg({ src, alt = '', className = '', fallback, circle = true }) {
  const [err, setErr] = useState(false);
  const showFallback = !src || err;
  const label = fallback ?? (alt ? alt.trim().slice(0, 1) : '?');

  if (showFallback) {
    return (
      <span className={`icon-fallback ${circle ? 'is-circle' : ''} ${className}`} role="img" aria-label={alt}>
        {label}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`icon-img ${circle ? 'is-circle' : ''} ${className}`}
      loading="lazy"
      decoding="async"
      onError={() => setErr(true)}
    />
  );
}
