import Link from 'next/link';
import { cityKeys, totalKeys } from '@/legends/data/keys';
import { comps } from '@/legends/data/comps';
import { runes as totalRunes } from '@/legends/data/runes';
import { labs } from '@/legends/data/labs';

export const metadata = {
  title: '英雄联盟传奇 · 海克斯典籍 · 弈览',
  description:
    '金铲铲之战「英雄联盟传奇 · 海克斯典籍」（S16.5）攻略：城邦秩序/科技钥匙机制、主流阵容与装备搭配。',
};

export default function LegendsHome() {
  return (
    <>
      <div className="lg-head">
        <h1 className="lg-title">英雄联盟传奇 · 海克斯典籍</h1>
        <p className="lg-sub">
          与「自然之力」不同的另一套玩法：核心是<strong>城邦钥匙</strong>——每个城邦羁绊都有秩序钥匙与科技钥匙两把，
          完成解锁条件后提供全局增益。钥匙决定你这局是走人口、经济还是输出，是阵容与经济规划的起点。
        </p>
        <div className="lg-meta">
          <span>{cityKeys.length} 个城邦</span>
          <span>{totalKeys} 把钥匙</span>
          <span>{comps.length} 套阵容</span>
          <span>{labs.length} 篇实测拆解</span>
        </div>
        <div className="lg-chips">
          <Link className="lg-chip" href="/legends/comps">
            查看全部 {comps.length} 套阵容 →
          </Link>
          <Link className="lg-chip" href="/legends/keys">
            城邦钥匙解锁表 →
          </Link>
          <Link className="lg-chip" href="/legends/runes">
            符文 → 阵容 → 装备（{totalRunes.length} 张）→
          </Link>
          <Link className="lg-chip" href="/legends/labs">
            实测台：玩家自建阵容拆解 →
          </Link>
          <Link className="lg-chip" href="/legends/items">
            装备与配装思路 →
          </Link>
        </div>
      </div>

      <section className="lg-block">
        <h2>玩法核心：两把钥匙</h2>
        <div className="lg-list">
          <div className="lg-row">
            <span className="lg-row-t">秩序钥匙</span>
            <span className="lg-row-d">
              前期解锁，负责滚雪球。条件相对温和（如登场一个三星巨神峰弈子、商店累计购买 12 次），
              解锁后立刻获得全局增益。
            </span>
          </div>
          <div className="lg-row">
            <span className="lg-row-t">科技钥匙</span>
            <span className="lg-row-d">
              后期质变，普遍要求「三星 + 10 级」。效果强力但门槛高，是大后期的冲刺目标，不要前期硬追。
            </span>
          </div>
        </div>
      </section>

      <section className="lg-block">
        <h2>城邦速览</h2>
        <div className="lg-grid">
          {cityKeys.map((c) => (
            <a className="lg-card" href="/legends/keys" key={c.city}>
              <h3>{c.city}</h3>
              <p className="lg-hook">{c.unlock}</p>
              <div className="lg-tags">
                {c.keys.map((k, i) => (
                  <span key={i}>{k.type === 'order' ? '秩序' : '科技'}</span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="lg-block">
        <h2>强度向阵容</h2>
        <p className="lg-note" style={{ marginBottom: 12, borderLeft: 'none', paddingLeft: 0 }}>
          T0 / S 级，能稳定上分的答案阵容。
        </p>
        <div className="lg-grid">
          {comps
            .filter((c) => c.tier === 'T0' || c.tier === 'S')
            .map((c) => (
              <Link className="lg-card lg-card-link" href={`/legends/comps/${c.slug}`} key={c.slug}>
                <h3>
                  {c.name}
                  <span className={`lg-badge ${c.tier.toLowerCase()}`}>{c.tier}</span>
                </h3>
                <p className="lg-hook">{c.hook}</p>
                <div className="lg-chips">
                  <span className="lg-chip">{c.style}</span>
                  <span className="lg-chip">{c.difficulty}</span>
                </div>
              </Link>
            ))}
        </div>
      </section>

      <section className="lg-block">
        <h2>特立独行 · 整活向</h2>
        <p className="lg-note" style={{ marginBottom: 12, borderLeft: 'none', paddingLeft: 0 }}>
          机制特别、成型有门槛，但一旦开出来就是别人没有的东西。
        </p>
        <div className="lg-grid">
          {comps
            .filter((c) => c.style === '整活')
            .map((c) => (
              <Link className="lg-card lg-card-link" href={`/legends/comps/${c.slug}`} key={c.slug}>
                <h3>
                  {c.name}
                  <span className={`lg-badge ${c.tier.toLowerCase()}`}>{c.tier}</span>
                </h3>
                <p className="lg-hook">{c.flavor}</p>
                <div className="lg-chips">
                  <span className="lg-chip">{c.city}</span>
                  <span className="lg-chip">{c.difficulty}</span>
                </div>
              </Link>
            ))}
        </div>
      </section>

      <section className="lg-block">
        <h2>实测台 · 玩家自建阵容</h2>
        <p className="lg-note" style={{ marginBottom: 12, borderLeft: 'none', paddingLeft: 0 }}>
          公开攻略之外的一套思路。只拆机制，不给胜率。
        </p>
        <div className="lg-grid">
          {labs.map((l) => (
            <Link className="lg-card lg-card-link" href={`/legends/labs/${l.slug}`} key={l.slug}>
              <h3>
                {l.name}
                <span className="lg-badge s">实测</span>
              </h3>
              <p className="lg-hook">{l.hook}</p>
              <div className="lg-chips">
                <span className="lg-chip">{l.city}</span>
                <span className="lg-chip">强度：{l.verdict}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="lg-block">
        <h2>装备</h2>
        <div className="lg-list">
          <div className="lg-row">
            <span className="lg-row-t">钥匙即装备</span>
            <span className="lg-row-d">
              海克斯典籍里钥匙占一个装备格，给谁戴直接决定体系走向。详见{' '}
              <a href="/legends/items" style={{ color: 'var(--hex)' }}>
                装备攻略
              </a>
              。
            </span>
          </div>
          <div className="lg-row">
            <span className="lg-row-t">配装顺序</span>
            <span className="lg-row-d">
              先定钥匙 → 主 C 三件套成套 → 前排至少一件保命装 → 重伤与破甲各备一件。
            </span>
          </div>
        </div>
      </section>

      <p className="lg-note">
        本板块资料整理自金铲铲官方钥匙表与前瞻阵容、游侠手游 / 17173 攻略、金铲铲阿助地区玩法，
        以及社区实测阵容（兔顶之弈 / 北派解说 / 手刃猫咪 / 铲铲有点6 等）。
        部分数值在不同来源间存在版本差异，已在对应篇目标注；实际数值与解锁条件以游戏内为准。
      </p>
    </>
  );
}
