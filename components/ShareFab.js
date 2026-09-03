'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ShareCard from './ShareCard';

/**
 * 全站右下角「分享」浮标：任意页面都能一键掏出当前页二维码。
 * 传播路径：手机打开 → 点分享 → 存二维码/海报 → 发朋友圈或群 → 好友扫码直达同一页。
 */
export default function ShareFab() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);

  // 路由切换时自动收起
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 打开时锁背景滚动 + ESC 关闭
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // 分享页本身不需要浮标
  if (pathname === '/share') return null;

  return (
    <>
      <button
        type="button"
        className="share-fab"
        onClick={() => setOpen(true)}
        aria-label="分享本页"
        title="分享本页"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm12 2h4v4h-4v-4zm-2-2h2v2h-2v-2z"
            fill="currentColor"
          />
        </svg>
        <span>分享</span>
      </button>

      {open && (
        <div className="share-sheet-mask" onClick={() => setOpen(false)} role="presentation">
          <div
            className="share-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="分享本页"
          >
            <div className="share-sheet-head">
              <b>分享这一页</b>
              <button type="button" className="share-sheet-close" onClick={() => setOpen(false)} aria-label="关闭">
                ×
              </button>
            </div>
            <ShareCard scope="page" compact />
            <a className="share-sheet-more" href="/share">
              想推整站？去分享中心 →
            </a>
          </div>
        </div>
      )}
    </>
  );
}
