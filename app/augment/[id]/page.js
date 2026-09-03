import augments from '@/data/tft/augments.json';
import IconImg from '@/components/IconImg';
import { SEASON } from '@/lib/season';

// /augment/[id] —— S18 强化符文长尾 SEO 页
// 数据源：data/tft/augments.json（283 符文，含 name/desc/tier/icon）。
// 承接搜索：「S18 XX 符文怎么用 / 几阶 / 强度如何」。

const TIER = {
  gold: { label: '金色', color: 'var(--gold)', border: 'var(--gold)' },
  silver: { label: '银色', color: 'var(--mute)', border: 'var(--line)' },
  prism: { label: '棱彩', color: 'var(--cost4)', border: 'var(--cost4)' },
};

export function generateStaticParams() {
  return augments.map((a) => ({ id: a.id }));
}

export function generateMetadata({ params }) {
  const a = augments.find((x) => x.id === params.id);
  if (!a) return { title: '符文未找到 · 弈览' };
  return {
    title: `S${SEASON.no} ${a.name} 符文 · 弈览`,
    description: `金铲铲 S${SEASON.no}「${SEASON.theme}」强化符文 ${a.name}（${TIER[a.tierKey]?.label || a.tier}）：${a.desc}`,
  };
}

export default function AugmentDetail({ params }) {
  const a = augments.find((x) => x.id === params.id);
  if (!a) return <p className="muted">未找到该符文（{params.id}）。</p>;

  const tier = TIER[a.tierKey] || { label: a.tier, color: 'var(--ink-soft)', border: 'var(--line)' };

  const faq = [
    {
      q: `S${SEASON.no} ${a.name} 符文怎么用？`,
      a: a.desc || '暂无该符文的效果描述。',
    },
    {
      q: `S${SEASON.no} ${a.name} 是几阶符文？`,
      a: `${tier.label}阶强化符文（金 > 银 > 棱彩，阶位越高越稀有、效果越强）。`,
    },
    {
      q: `S${SEASON.no} ${a.name} 强度如何？`,
      a: `属于${tier.label}阶强化符文。具体强度需结合阵容与局势，建议在阵容运营中作为强化位阶的取舍参考。`,
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
      <a className="back-link" href="/augments">← 返回符文总览</a>

      <div className="detail-head">
        <div className="item-detail-icon">
          <IconImg src={a.icon} alt={a.name} className="cell-ic" circle={false} />
        </div>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <h1>{a.name}</h1>
          <div className="detail-meta" style={{ marginTop: 4, marginBottom: 0 }}>
            <span className="tag" style={{ color: tier.color, borderColor: tier.border }}>
              {tier.label}阶符文
            </span>
            <span className="season-chip">金铲铲 <b>S{SEASON.no} · {SEASON.theme}</b></span>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>符文效果</h3>
        <div className="item-desc">
          <p className="guide-p item-desc-line">{a.desc || '暂无描述。'}</p>
        </div>
      </div>

      <div className="panel">
        <h3>大家都在搜 · {a.name}</h3>
        <div className="faq">
          {faq.map((f) => (
            <div className="faq-item" key={f.q}>
              <p className="faq-q">{f.q}</p>
              <p className="faq-a">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="kv" style={{ marginTop: 14 }}>
          <a className="tag tag-with-icon" href="/augments">符文总览</a>
          <a className="tag tag-with-icon" href="/champions">弈子出装</a>
          <a className="tag tag-with-icon" href="/items">装备库</a>
        </div>
      </div>
    </div>
  );
}
