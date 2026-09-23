import Link from 'next/link';
import { notFound } from 'next/navigation';
import { comps } from '@/legends/data/comps';

export function generateStaticParams() {
  return comps.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }) {
  const c = comps.find((x) => x.slug === params.slug);
  if (!c) return { title: '阵容未找到 · 海克斯典籍 · 弈览' };
  const desc = `${c.name}：${c.hook}。${c.flavor}含阵容组成、羁绊搭配、城邦钥匙解锁条件与装备分配。`;
  return {
    title: `${c.name} · 海克斯典籍阵容 · 弈览`,
    description: desc.slice(0, 150),
    alternates: { canonical: `https://yilangames.com/legends/comps/${c.slug}` },
    openGraph: { title: `${c.name} · 弈览`, description: desc.slice(0, 150) },
  };
}

export default function CompDetailPage({ params }) {
  const idx = comps.findIndex((x) => x.slug === params.slug);
  if (idx < 0) notFound();
  const c = comps[idx];
  const prev = comps[(idx - 1 + comps.length) % comps.length];
  const next = comps[(idx + 1) % comps.length];

  return (
    <>
      <nav className="lg-crumb">
        <Link href="/legends">海克斯典籍</Link>
        <span>/</span>
        <Link href="/legends/comps">阵容</Link>
        <span>/</span>
        <em>{c.name}</em>
      </nav>

      <div className="lg-head">
        <h1 className="lg-title">
          {c.name}
          <span className={`lg-badge ${c.tier.toLowerCase()}`} style={{ marginLeft: 10 }}>
            {c.tier}
          </span>
        </h1>
        <p className="lg-sub">{c.hook}</p>
        <p className="lg-flavor">{c.flavor}</p>
        <div className="lg-chips">
          <span className="lg-chip">城邦：{c.city}</span>
          <span className="lg-chip">玩法：{c.style}</span>
          <span className="lg-chip">难度：{c.difficulty}</span>
          {c.tags.map((t) => (
            <span className="lg-chip" key={t}>
              #{t}
            </span>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>阵容组成</h2>
        <div className="lg-tags">
          {c.units.map((u) => (
            <span key={u}>{u}</span>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>羁绊搭配</h2>
        <div className="lg-tags">
          {c.traits.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>城邦钥匙</h2>
        <div className="lg-keys">
          <div className="lg-key order">
            <div className="lg-key-top">
              <span className="lg-key-type">钥匙</span>
              <span className="lg-key-cond">{c.key.name}</span>
            </div>
            <div className="lg-key-attr">解锁条件：{c.key.cond}</div>
            <div className="lg-key-attr">钥匙属性：{c.key.attr}</div>
            <div className="lg-key-eff">钥匙效果：{c.key.effect}</div>
          </div>
        </div>
      </div>

      <div className="lg-block">
        <h2>装备分配</h2>
        <div className="lg-list">
          {c.items.map((it) => (
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
        <h2>运营思路</h2>
        <div className="lg-list">
          {c.play.map((p, i) => (
            <div className="lg-row" key={i}>
              <span className="lg-row-t">{String(i + 1).padStart(2, '0')}</span>
              <span className="lg-row-d">{p}</span>
            </div>
          ))}
        </div>
      </div>

      {c.conflicts ? (
        <div className="lg-block">
          <h2>口径提示</h2>
          <p className="lg-warn">⚠️ {c.conflicts}</p>
        </div>
      ) : null}

      <div className="lg-block">
        <h2>资料出处</h2>
        <p className="lg-note">本篇内容整理自：{c.source}。实际数值与解锁条件以游戏内为准。</p>
      </div>

      <div className="lg-pager">
        <Link href={`/legends/comps/${prev.slug}`}>← {prev.name}</Link>
        <Link href={`/legends/comps/${next.slug}`} className="lg-pager-next">
          {next.name} →
        </Link>
      </div>
    </>
  );
}
