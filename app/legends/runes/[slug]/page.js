import Link from 'next/link';
import { notFound } from 'next/navigation';
import { runes, CATEGORIES } from '@/legends/data/runes';

export function generateStaticParams() {
  return runes.map((r) => ({ slug: r.slug }));
}

export function generateMetadata({ params }) {
  const r = runes.find((x) => x.slug === params.slug);
  if (!r) return { title: '符文未找到 · 海克斯典籍 · 弈览' };
  const desc = `${r.name}（${r.tier}）：${r.tagline}。属性倾向解读、适配阵容、装备分配与运营节奏。`;
  return {
    title: `${r.name} · 符文攻略 · 海克斯典籍 · 弈览`,
    description: desc.slice(0, 150),
    alternates: { canonical: `https://yilangames.com/legends/runes/${r.slug}` },
    openGraph: { title: `${r.name} · 弈览`, description: desc.slice(0, 150) },
  };
}

export default function RuneDetailPage({ params }) {
  const idx = runes.findIndex((x) => x.slug === params.slug);
  if (idx < 0) notFound();
  const r = runes[idx];
  const prev = runes[(idx - 1 + runes.length) % runes.length];
  const next = runes[(idx + 1) % runes.length];
  const cat = CATEGORIES.find((c) => c.id === r.category);

  return (
    <>
      <nav className="lg-crumb">
        <Link href="/legends">海克斯典籍</Link>
        <span>/</span>
        <Link href="/legends/runes">符文</Link>
        <span>/</span>
        <em>{r.name}</em>
      </nav>

      <div className="lg-head">
        <h1 className="lg-title">
          {r.name}
          <span
            className={`lg-badge ${r.tier === '棱彩' ? 'prismatic' : r.tier === '黄金' ? 'gold' : 'silver'}`}
            style={{ marginLeft: 10 }}
          >
            {r.tier}
          </span>
        </h1>
        <p className="lg-sub">{r.tagline}</p>
        <div className="lg-chips">
          {cat ? <span className="lg-chip">类别：{cat.label}</span> : null}
          <span className="lg-chip">品质：{r.tier}</span>
          <span className="lg-chip">适配 {r.fitComps.length} 套阵容</span>
        </div>
      </div>

      <div className="lg-block">
        <h2>符文效果（官方描述）</h2>
        <div className="lg-list">
          <div className="lg-row">
            <span className="lg-row-t">效果</span>
            <span className="lg-row-d">{r.effect}</span>
          </div>
        </div>
      </div>

      <div className="lg-block">
        <h2>属性倾向：它到底给了你什么</h2>
        <p className="lg-tendency">{r.tendency}</p>
        {r.stats ? <p className="lg-warn" style={{ marginTop: 12 }}>📊 实战数据：{r.stats}</p> : null}
      </div>

      <div className="lg-block">
        <h2>据此该玩什么阵容</h2>
        <div className="lg-list">
          {r.fitComps.map((f, i) => (
            <div className="lg-row" key={f.slug}>
              <span className="lg-row-t">{i === 0 ? '首选' : '备选'}</span>
              <span className="lg-row-d">
                <Link href={`/legends/comps/${f.slug}`} className="lg-inline-link">
                  {f.name} →
                </Link>
                <br />
                {f.reason}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>装备分配</h2>
        <div className="lg-list">
          {r.items.map((it) => (
            <div className="lg-row" key={it.unit}>
              <span className="lg-row-t">{it.unit}</span>
              <span className="lg-row-d">
                {it.items.join(' · ')}
                {it.role && it.role !== '—' ? `　（${it.role}）` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>运营节奏</h2>
        <div className="lg-list">
          {r.play.map((p, i) => (
            <div className="lg-row" key={i}>
              <span className="lg-row-t">{String(i + 1).padStart(2, '0')}</span>
              <span className="lg-row-d">{p}</span>
            </div>
          ))}
        </div>
      </div>

      {r.avoid ? (
        <div className="lg-block">
          <h2>避坑提示</h2>
          <p className="lg-warn">{r.avoid}</p>
        </div>
      ) : null}

      <div className="lg-block">
        <h2>资料出处</h2>
        <p className="lg-note">本篇内容整理自：{r.source}。符文品质与数值以游戏内为准。</p>
      </div>

      <div className="lg-pager">
        <Link href={`/legends/runes/${prev.slug}`}>← {prev.name}</Link>
        <Link href={`/legends/runes/${next.slug}`} className="lg-pager-next">
          {next.name} →
        </Link>
      </div>
    </>
  );
}
