import { loadTraits } from '@/lib/loadData';
import { SEASON } from '@/lib/season';

// /trait/[name] —— S18 羁绊长尾 SEO 页
// 数据源：comps.opgg.json 的 traits 字段（loadTraits 聚合）。
// 承接搜索：「S18 XX羁绊怎么玩 / 给谁带 / 哪些阵容在用」。

export function generateStaticParams() {
  return loadTraits().map((t) => ({ name: t.name }));
}

export function generateMetadata({ params }) {
  // Next 对非 ASCII 动态参数传入的是 URL 编码串，需解码后再匹配
  const name = decodeURIComponent(params.name);
  const t = loadTraits().find((x) => x.name === name);
  if (!t) return { title: '羁绊未找到 · 弈览' };
  const compNames = t.comps.map((c) => c.name).slice(0, 5).join('、');
  return {
    title: `S18 ${t.name} 羁绊 · 弈览`,
    description: `金铲铲 S${SEASON.no}「${SEASON.theme}」${t.name}羁绊怎么玩？当前版本 ${t.count} 套阵容在用：${compNames}。附各阵容强度分与运营思路。`,
  };
}

function tierClass(tier) {
  if (tier === 'T0') return 'tag-t0';
  if (tier === 'T1') return 'tag-t1';
  return 'plain';
}

export default function TraitDetail({ params }) {
  const all = loadTraits();
  // Next 对非 ASCII 动态参数传入的是 URL 编码串，需解码后再匹配
  const name = decodeURIComponent(params.name);
  const t = all.find((x) => x.name === name);
  if (!t) return <p className="muted">未找到该羁绊（{name}）。</p>;

  const isExclusive = /专属/.test(t.name);

  const faq = [
    {
      q: `S${SEASON.no} ${t.name} 羁绊怎么玩？`,
      a: `在金铲铲 S${SEASON.no}「${SEASON.theme}」中，${t.name}是 ${t.count} 套强势阵容的核心羁绊。下方列出当前版本所有以该羁绊为主力的阵容，点击可查看完整运营思路、站位与克制关系。`,
    },
    {
      q: `S${SEASON.no} ${t.name} 羁绊哪些阵容在用？`,
      a: t.comps.length
        ? `${t.comps.map((c) => c.name).join('、')}。`
        : '当前版本暂无公开阵容以该羁绊为主力。',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="stack">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <a className="back-link" href="/trait">← 返回羁绊总览</a>

      <div className="detail-head">
        <h1>{t.name}</h1>
        <span className="tag tag-wild">S{SEASON.no} 羁绊</span>
        {isExclusive ? <span className="tag tag-gold">专属羁绊</span> : null}
        <span className="season-chip">金铲铲 <b>S{SEASON.no} · {SEASON.theme}</b></span>
      </div>
      <div className="detail-meta">
        {t.count} 套阵容在使用该羁绊 · 数据随 OP.GG 实时同步
      </div>

      <div className="panel">
        <h3>羁绊简介</h3>
        <p className="guide-p">
          在金铲铲之战 S{SEASON.no}「{SEASON.theme}」版本中，<b>{t.name}</b>
          {isExclusive
            ? ' 是某位弈子的专属羁绊，仅在该弈子阵容中触发。'
            : ` 是 ${t.count} 套强势阵容的核心羁绊之一。`}
          羁绊的激活与层数、阵容的运营节奏、核心装备取舍密切相关，下面按强度分从高到低列出当前版本所有以该羁绊为主力的阵容。
        </p>
      </div>

      <div className="panel">
        <h3>用 {t.name} 的阵容（{t.count} 套）</h3>
        {t.comps.length ? (
          <ul className="item-best-list">
            {t.comps.map((c) => (
              <li key={c.compId}>
                <span className={`tag tag-${tierClass(c.tier)}`} style={{ flex: '0 0 auto' }}>{c.tier}</span>
                <a className="ibl-name" href={`/comp/${c.compId}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>{c.name}</a>
                <span className="ibl-meta">
                  强度分 <b>{c.opScore ? c.opScore.toFixed(2) : '—'}</b>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">当前版本暂无公开阵容以该羁绊为主力。</p>
        )}
      </div>

      <div className="panel">
        <h3>大家还在搜</h3>
        <div className="kv">
          <a className="tag tag-with-icon" href="/trait">全部羁绊总览</a>
          <a className="tag tag-with-icon" href="/items">装备库</a>
          <a className="tag tag-with-icon" href="/tools/quiz">装备合成小测</a>
        </div>
      </div>
    </div>
  );
}
