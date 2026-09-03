'use client';

import { useState } from 'react';

/** 一行可复制的传播文案：点一下就进剪贴板，方便发群 / 发游戏内聊天 */
export default function CopyLine({ label, text }) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    const full = text.replace('{URL}', typeof window !== 'undefined' ? window.location.origin + '/' : '');
    try {
      await navigator.clipboard.writeText(full);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = full;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  };

  return (
    <div className="copy-line">
      <div className="copy-line-body">
        <span className="copy-line-label">{label}</span>
        <p className="copy-line-text">{text.replace('{URL}', '本站链接')}</p>
      </div>
      <button type="button" className="btn ghost sm" onClick={copy}>
        {done ? '已复制' : '复制'}
      </button>
    </div>
  );
}
