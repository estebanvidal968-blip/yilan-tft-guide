import champs from '@/data/tft/champs.json';
import itemsTft from '@/data/tft/items.json';
import IconImg from '@/components/IconImg';
import { SEASON } from '@/lib/season';

// /champion/[id] —— S18 弈子出装长尾 SEO 页
// 数据源：data/tft/champs.json（66 弈子，含 topBuilds 出装 + 胜率/前四率/平均名次/增益）。
// 承接搜索：「S18 XX 出什么装备 / 推荐出装 / 强度如何」。

export function generateStaticParams() {
  return champs.map((c) => ({ id: c.id }));
}

export function generateMetadata({ params }) {
  const c = champs.find((x) => x.id === params.id);
  if (!c) return { title: '弈子未找到 · 弈览' };
  const top = (c.topBuilds || [])[0];
  const topStr = top ? top.itemNames.join('、') : '';
  return {
    title: `S${SEASON.no} ${c.name} 出装 · 弈览`,
    description: `金铲铲 S${SEASON.no}「${SEASON.theme}」${c.name}推荐出装：${topStr}。含各套出装的胜率、前四率、平均名次与增益数据。`,
  };
}

export default function ChampDetail({ params }) {
  const c = champs.find((x) => x.id === params.id);
  if (!c) return <p className="muted">未找到该弈子（{params.id}）。</p>;

  const ITEM_MAP = new Map((itemsTft || []).map((i) => [i.id, { name: i.name, icon: i.icon }]));
  const builds = (c.topBuilds || []).slice(0, 6);
  const cost = c.cost || 1;
  const hasData = (c.sampleCount || 0) > 0;

  const faq = [
    {
      q: `S${SEASON.no} ${c.name} 出什么装备？`,
      a: builds.length
        ? `当前版本 ${c.name} 主流出装为：${builds
            .slice(0, 3)
            .map((b) => b.itemNames.join(' + '))
            .join('；')}。可参考下方各套出装的胜率与平均名次取舍。`
        : '暂无该弈子的出装统计。',
    },
    {
      q: `S${SEASON.no} ${c.name} 推荐出装哪套强？`,
      a: builds.length
        ? `综合胜率与平均名次，优先看 ${builds[0].itemNames.join(' + ')}（胜率 ${(
            builds[0].winRate * 100
          ).toFixed(1)}%、平均名次 ${builds[0].ap.toFixed(2)}）。`
        : '暂无数据。',
    },
    {
      q: `S${SEASON.no} ${c.name} 强度如何？`,
      a: hasData
        ? `平均名次 ${c.baseline?.toFixed?.(2)}，样本量 ${c.sampleCount.toLocaleString?.() || c.sampleCount}。名次越低越强。`
        : '暂无样本。',
    },
  ];
  const faqJsonLd = {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <a className="back-link" href="/champions">← 返回弈子总览</a>

      <div className="detail-head">
        <div className="item-detail-icon">
          <IconImg src={c.icon} alt={c.name} className="cell-ic" circle={false} />
        </div>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <h1>{c.name}</h1>
          <div className="detail-meta" style={{ marginTop: 4, marginBottom: 0 }}>
            <span className="tag" style={{ color: `var(--cost${cost})`, borderColor: `var(--cost${cost})` }}>
              {cost} 费
            </span>
            {hasData ? (
              <span className="muted">平均名次 {c.baseline?.toFixed?.(2)} · 样本 {c.sampleCount.toLocaleString?.()}</span>
            ) : (
              <span className="tag tag-plain">暂无样本</span>
            )}
            <span className="season-chip">金铲铲 <b>S{SEASON.no} · {SEASON.theme}</b></span>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>推荐出装（Top {builds.length}）</h3>
        <ul className="champ-build-list">
          {builds.map((b, i) => (
            <li key={i} className="champ-build">
              <div className="cb-items">
                {b.items.map((itid, j) => {
                  const m = ITEM_MAP.get(itid);
                  if (!m) return null;
                  return (
                    <a key={itid} className="cb-item" href={`/item/${itid}`} title={m.name}>
                      <IconImg src={m.icon} alt={m.name} fallback={m.name.slice(0, 1)} className="cb-ic" />
                      <span>{m.name}</span>
                    </a>
                  );
                })}
              </div>
              <div className="cb-stats">
                <span><b>{(b.winRate * 100).toFixed(1)}%</b> 胜率</span>
                <span><b>{(b.top4Rate * 100).toFixed(1)}%</b> 前四</span>
                <span>名次 <b>{b.ap.toFixed(2)}</b></span>
                <span>增益 <b>+{b.delta.toFixed(2)}</b></span>
                <span className="muted">场次 {b.n}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <h3>大家都在搜 · {c.name}</h3>
        <div className="faq">
          {faq.map((f) => (
            <div className="faq-item" key={f.q}>
              <p className="faq-q">{f.q}</p>
              <p className="faq-a">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="kv" style={{ marginTop: 14 }}>
          <a className="tag tag-with-icon" href="/champions">弈子总览</a>
          <a className="tag tag-with-icon" href="/items">装备库</a>
          <a className="tag tag-with-icon" href="/tools/quiz">装备合成小测</a>
        </div>
      </div>
    </div>
  );
}
