'use client';
import { useEffect, useRef } from 'react';

// 广告位组件（广告就绪占位）
// 激活条件：设置环境变量 NEXT_PUBLIC_AD_CLIENT（广告联盟发布商 ID）后，
// 会渲染对应联盟的广告单元占位；未设置时显示「广告位」占位框，不加载任何外部脚本。
// 用法：<AdSlot slot="ca-app-pub-xxxx/12345" />
export default function AdSlot({ slot = 'default', className = '' }) {
  const ref = useRef(null);
  const client = process.env.NEXT_PUBLIC_AD_CLIENT;

  useEffect(() => {
    if (!client || !ref.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* 广告脚本未就绪时静默忽略 */
    }
  }, [client, slot]);

  if (!client) {
    return (
      <div className={`ad-slot ad-slot--placeholder ${className}`} aria-hidden="true">
        <span>广告位</span>
      </div>
    );
  }

  return (
    <div className={`ad-slot ${className}`} ref={ref}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
