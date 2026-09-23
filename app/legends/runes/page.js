import Link from 'next/link';
import { runes, CATEGORIES } from '@/legends/data/runes';

export const metadata = {
  title: '强化符文 · 海克斯典籍 · 弈览',
  description:
    '海克斯典籍强化符文怎么选：暮光试炼、解封魔武、登上最高峰、投资++、小伙伴等 10 张符文的属性倾向解读，以及据此该玩什么阵容、做什么装备。',
};

export default function LegendsRunesPage() {
  const groups = CATEGORIES.map((c) => ({ ...c, list: runes.filter((r) => r.category === c.id) })).filter(
    (g) => g.list.length > 0
  );

  return (
    <>
      <div className="lg-head">
        <h1 className="lg-title">符文 → 阵容 → 装备</h1>
        <p className="lg-sub">
          符文选择的顺序不该是"哪个强拿哪个"，而是先看<strong>它给了你什么属性</strong>，再倒推这局该走哪套阵容、装备怎么做。
          下面 {runes.length} 张符文按「给的东西」分类，每篇都接上对应的阵容与装备方案。
        </p>
        <div className="lg-meta">
          <span>共 {runes.length} 张符文</span>
          <span>{CATEGORIES.length} 个属性类别</span>
          <span>每篇均标注官方符文描述与出处</span>
        </div>
      </div>

      <div className="lg-toc">
        <span className="lg-toc-label">按属性跳：</span>
        {groups.map((g) => (
          <a href={`#cat-${g.id}`} key={g.id}>
            {g.label}（{g.list.length}）
          </a>
        ))}
      </div>

      {groups.map((g) => (
        <section className="lg-group" id={`cat-${g.id}`} key={g.id}>
          <h2 className="lg-group-title">
            {g.label}
            <span>{g.desc}</span>
          </h2>
          <div className="lg-grid">
            {g.list.map((r) => (
              <article className="lg-card lg-card-link" key={r.slug}>
                <h3>
                  <Link href={`/legends/runes/${r.slug}`}>{r.name}</Link>
                  <span className={`lg-badge ${r.tier === '棱彩' ? 'prismatic' : r.tier === '黄金' ? 'gold' : 'silver'}`}>
                    {r.tier}
                  </span>
                </h3>
                <p className="lg-hook">{r.tagline}</p>
                <div className="lg-tags" style={{ marginTop: 10 }}>
                  <span>适配 {r.fitComps.length} 套阵容</span>
                  {r.fitComps.slice(0, 1).map((f) => (
                    <span key={f.slug}>{f.name.split(' · ')[0]}</span>
                  ))}
                </div>
                <Link className="lg-more" href={`/legends/runes/${r.slug}`}>
                  看属性倾向 · 阵容 · 装备 →
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}

      <p className="lg-note">
        符文描述逐字引用金铲铲官方强化符文表；阵容与装备方案整理自林小北、金铲铲山海、金铲铲阿助、兔顶之弈、北派解说等公开攻略。
        符文品质与数值以游戏内为准。
      </p>
    </>
  );
}
