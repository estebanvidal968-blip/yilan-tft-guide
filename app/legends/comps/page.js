import Link from 'next/link';
import { comps } from '@/legends/data/comps';

export const metadata = {
  title: '阵容攻略 · 海克斯典籍 · 弈览',
  description:
    '英雄联盟传奇海克斯典籍 30 套阵容：巨神峰斗士巴德、比尔吉沃特银蛇币、暗裔之镰蛮王、9 虚空大龙、暮光试炼亚恒等，含阵容组成、羁绊、城邦钥匙与装备分配。',
};

const STYLE_ORDER = ['赌狗', '运营', '速9', '整活'];

export default function LegendsCompsPage() {
  const cities = [...new Set(comps.map((c) => c.city))];
  const groups = STYLE_ORDER.map((s) => ({ style: s, list: comps.filter((c) => c.style === s) })).filter(
    (g) => g.list.length > 0
  );

  return (
    <>
      <div className="lg-head">
        <h1 className="lg-title">阵容攻略</h1>
        <p className="lg-sub">
          海克斯典籍的阵容是围绕「城邦钥匙」搭的——先确定要开哪把钥匙，再倒推阵容成员与装备。
          下面 30 套按玩法类型分组：想快速上手看「运营」，想搏一把看「赌狗」，想玩点不一样的看「整活」。
        </p>
        <div className="lg-meta">
          <span>共 {comps.length} 套</span>
          <span>覆盖 {cities.length} 个城邦 / 组合</span>
          <span>每篇均标注资料出处</span>
        </div>
      </div>

      <div className="lg-toc">
        <span className="lg-toc-label">按玩法跳：</span>
        {groups.map((g) => (
          <a href={`#style-${encodeURIComponent(g.style)}`} key={g.style}>
            {g.style}（{g.list.length}）
          </a>
        ))}
      </div>

      {groups.map((g) => (
        <section className="lg-group" id={`style-${encodeURIComponent(g.style)}`} key={g.style}>
          <h2 className="lg-group-title">
            {g.style}
            <span>{g.list.length} 套</span>
          </h2>
          <div className="lg-grid">
            {g.list.map((c) => (
              <article className="lg-card lg-card-link" key={c.slug}>
                <h3>
                  <Link href={`/legends/comps/${c.slug}`}>{c.name}</Link>
                  <span className={`lg-badge ${c.tier.toLowerCase()}`}>{c.tier}</span>
                </h3>
                <p className="lg-hook">{c.hook}</p>
                <div className="lg-chips">
                  <span className="lg-chip">{c.city}</span>
                  <span className="lg-chip">{c.style}</span>
                  <span className="lg-chip">{c.difficulty}</span>
                </div>
                <div className="lg-tags" style={{ marginTop: 10 }}>
                  {c.tags.map((t) => (
                    <span key={t}>#{t}</span>
                  ))}
                </div>
                <div className="lg-card-key">
                  <span className="lg-card-key-t">钥匙</span>
                  <span>{c.key.name}</span>
                </div>
                <Link className="lg-more" href={`/legends/comps/${c.slug}`}>
                  查看阵容组成 · 装备 · 运营 →
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}

      <p className="lg-note">
        资料来源：金铲铲官方钥匙表与前瞻阵容、游侠手游 / 17173 攻略、金铲铲阿助地区玩法、社区实测阵容（兔顶之弈 / 北派解说 / 手刃猫咪 / 铲铲有点6 等）。
        部分数值在不同来源间存在版本差异，已在对应篇目标注；实际数值与解锁条件以游戏内为准。
      </p>
    </>
  );
}
