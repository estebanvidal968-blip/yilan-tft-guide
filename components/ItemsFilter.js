'use client';

import { useMemo, useState } from 'react';
import IconImg from './IconImg';

/**
 * 装备矩阵客户端筛选壳：
 * - 顶栏：搜索框（按 name 模糊匹配）+ 4 个 tab（全部 / 光明武器 / 成装 / 散件）
 * - 下方按当前 tab 渲染对应的网格
 *
 * 神器（纹章）已按需求从装备库移除，artifacts 恒为空数组，此处不再渲染该区块。
 *
 * 数据由父级 RSC（/items/page.js）注入；本组件只控制显隐与过滤，不重复请求数据。
 */
export default function ItemsFilter({ artifacts, radiants, completed, components }) {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');

  const matchName = (it) =>
    q.trim() === '' ? true : (it.name || '').includes(q.trim());

  const tabs = useMemo(
    () => [
      { id: 'all', label: '全部', count: artifacts.length + radiants.length + completed.length + components.length },
      { id: 'radiant', label: '光明武器', count: radiants.length },
      { id: 'completed', label: '成装', count: completed.length },
      { id: 'components', label: '散件', count: components.length },
    ],
    [artifacts, radiants, completed, components],
  );

  const showTab = (id) => tab === 'all' || tab === id;

  const filtered = {
    artifact: artifacts.filter(matchName),
    radiant: radiants.filter(matchName),
    completed: completed.filter(matchName),
    components: components.filter(matchName),
  };

  const total = filtered.artifact.length + filtered.radiant.length + filtered.completed.length + filtered.components.length;

  return (
    <>
      {/* 工具栏 */}
      <div className="items-toolbar">
        <div className="items-search">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索装备名 · 如 智慧末刃 / 光明 / 红霸符"
            aria-label="搜索装备"
          />
        </div>
        <div className="items-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`items-tab ${tab === t.id ? 'is-on' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label} <span className="dim">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="items-count">
          {q.trim() ? `匹配 ${total} / ${tabs[0].count}` : `共 ${tabs[0].count} 件`}
        </div>
      </div>

      {/* 光明武器区 */}
      {showTab('radiant') && filtered.radiant.length > 0 && (
        <Section
          title="🟢 光明武器 · 光明版"
          sub="普通成装的强化版（数值更强）。OP.GG 暂未收录光明武器的独立对局样本，卡片名次取原型装备作参考。"
          items={filtered.radiant}
          tone="wild"
        />
      )}
      {showTab('radiant') && filtered.radiant.length === 0 && <Empty label="无匹配光明武器" />}

      {/* 普通成装区 */}
      {showTab('completed') && filtered.completed.length > 0 && (
        <PlainSection title="普通成装" items={filtered.completed} />
      )}
      {showTab('completed') && filtered.completed.length === 0 && <Empty label="无匹配成装" />}

      {/* 散件区 */}
      {showTab('components') && filtered.components.length > 0 && (
        <PlainSection title="散件" items={filtered.components} />
      )}
      {showTab('components') && filtered.components.length === 0 && <Empty label="无匹配散件" />}
    </>
  );
}

function Section({ title, sub, items, tone }) {
  return (
    <section className="item-special-block">
      <div className="item-special-head">
        <h3 className="group-title">
          {title} <span className="dim">· {items.length} 件</span>
        </h3>
        {sub ? <p className="section-sub" style={{ margin: '4px 0 14px' }}>{sub}</p> : null}
      </div>
      <div className="item-special-grid">
        {items.map((it) => {
          const top = (it.best || [])[0];
          return (
            <a key={it.itemId} className={`item-special-card tone-${tone}`} href={`/item/${it.itemId}`}>
              <div className="isc-ic">
                <IconImg src={it.icon} alt={it.name} className="cell-ic" circle={false} />
              </div>
              <div className="isc-body">
                <div className="isc-name" title={it.name}>{it.name}</div>
                <div className="isc-stats">
                  <span className="isc-stat" data-k="ap">
                    <i>平均名次</i>
                    <b>{(it.avgPlacement || 0) > 0 ? it.avgPlacement.toFixed(2) : '—'}</b>
                  </span>
                  <span className="isc-stat" data-k="n">
                    <i>出场</i>
                    <b>{(it.sampleCount || 0) > 0 ? formatN(it.sampleCount) : '—'}</b>
                  </span>
                </div>
                {top ? (
                  <div className="isc-best">
                    <IconImg src={top.champIcon} alt={top.champName} className="isc-cic" circle={false} />
                    <span className="isc-best-name">{top.champName}</span>
                    <span className="isc-best-delta">+{top.delta?.toFixed(2)}</span>
                  </div>
                ) : it.baseRef ? (
                  // 光明武器无独立样本 → 退到原型装备数据作参考，避免整卡显示 0.00
                  <div className="isc-best muted" title="OP.GG 无光明武器独立样本，此处为原型装备数据">
                    原型 {it.baseRef.name} · {it.baseRef.avgPlacement?.toFixed(2)}
                  </div>
                ) : (
                  <div className="isc-best muted">暂无样本</div>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function PlainSection({ title, items }) {
  return (
    <section className="item-special-block">
      <div className="item-special-head">
        <h3 className="group-title">
          {title} <span className="dim">· {items.length} 件</span>
        </h3>
      </div>
      <div className="item-grid">
        {items.map((it, i) => (
          <div key={it.itemId} className="item-cell enter" style={{ animationDelay: `${Math.min(i, 14) * 40}ms` }}>
            <IconImg src={it.icon || null} alt={it.name} className="ic-icon" fallback={(it.name || '?').slice(0, 1)} />
            <div className="ic-name">{it.name}</div>
            <div className="ic-tier">{it.tier}</div>
            <a className="cc-link" href={`/item/${it.itemId}`} aria-label={it.name} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Empty({ label }) {
  return <div className="empty-state">{label}</div>;
}

function formatN(n) {
  if (!n && n !== 0) return '—';
  if (n >= 10000) return (n / 10000).toFixed(1) + ' 万';
  return n.toString();
}