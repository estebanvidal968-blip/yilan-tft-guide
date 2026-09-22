import { cityKeys, totalKeys } from '@/legends/data/keys';
import { comps, compsReady } from '@/legends/data/comps';

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
          <span>{comps.length} 套阵容（完整 {compsReady.length}）</span>
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
        <h2>阵容速览</h2>
        <div className="lg-grid">
          {comps.map((c) => (
            <a className="lg-card" href="/legends/comps" key={c.slug}>
              <h3>
                {c.name}
                <span className={`lg-badge ${c.tier.toLowerCase()}`}>{c.tier}</span>
                {c.draft ? <span className="lg-badge draft">待补齐</span> : null}
              </h3>
              <p className="lg-hook">{c.hook}</p>
              <div className="lg-tags">
                {c.units.slice(0, 5).map((u) => (
                  <span key={u}>{u}</span>
                ))}
                {c.units.length > 5 ? <span>+{c.units.length - 5}</span> : null}
              </div>
            </a>
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
        本板块资料整理自官方前瞻与公开攻略，部分为测试服数据，实际数值与解锁条件以游戏内为准。
        标注「待补齐」处为资料不足，待实测补充。
      </p>
    </>
  );
}
