import { comps, compsReady } from '@/legends/data/comps';

export const metadata = {
  title: '阵容 · 海克斯典籍 · 弈览',
  description: '海克斯典籍主流阵容：巨神峰、比尔吉沃特、三钥匙等，含阵容组成、羁绊、钥匙与装备分配。',
};

export default function LegendsCompsPage() {
  const draftCount = comps.length - compsReady.length;
  return (
    <>
      <div className="lg-head">
        <h1 className="lg-title">阵容攻略</h1>
        <p className="lg-sub">
          海克斯典籍的阵容是围绕「城邦钥匙」搭的——先确定要开哪把钥匙，再倒推阵容成员与装备。每套下面给出组成、羁绊、钥匙、装备分配和运营节奏。
        </p>
        <div className="lg-meta">
          <span>共 {comps.length} 套</span>
          <span>资料完整 {compsReady.length} 套</span>
          <span>待补齐 {draftCount} 套</span>
        </div>
      </div>

      <div className="lg-grid">
        {comps.map((c) => (
          <article key={c.slug} className="lg-card" id={c.slug}>
            <h3>
              {c.name}
              <span className={`lg-badge ${c.tier.toLowerCase()}`}>{c.tier}</span>
              {c.draft ? <span className="lg-badge draft">待补齐</span> : null}
            </h3>
            <p className="lg-hook">{c.hook}</p>

            <div className="lg-block" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: '0.95rem' }}>阵容组成</h2>
              <div className="lg-tags">
                {c.units.map((u) => (
                  <span key={u}>{u}</span>
                ))}
              </div>
            </div>

            <div className="lg-block" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: '0.95rem' }}>羁绊</h2>
              <div className="lg-tags">
                {c.traits.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>

            <div className="lg-block" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: '0.95rem' }}>钥匙</h2>
              <div className="lg-keys">
                <div className="lg-key order">
                  <div className="lg-key-top">
                    <span className="lg-key-type">钥匙</span>
                    <span className="lg-key-cond">{c.key.name}</span>
                  </div>
                  <div className="lg-key-attr">解锁：{c.key.cond}</div>
                  <div className="lg-key-eff">效果：{c.key.effect}</div>
                </div>
              </div>
            </div>

            <div className="lg-block" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: '0.95rem' }}>装备分配</h2>
              <div className="lg-list">
                {c.items.map((it) => (
                  <div className="lg-row" key={it.unit}>
                    <span className="lg-row-t">{it.unit}</span>
                    <span className="lg-row-d">
                      {it.items.join(' · ')}
                      {it.role && it.role !== '—' ? `（${it.role}）` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg-block" style={{ marginBottom: 0 }}>
              <h2 style={{ fontSize: '0.95rem' }}>运营思路</h2>
              <div className="lg-list">
                {c.play.map((p, i) => (
                  <div className="lg-row" key={i}>
                    <span className="lg-row-t">{i + 1}</span>
                    <span className="lg-row-d">{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="lg-note">
        资料来源：官方前瞻与公开攻略整理，部分为测试服数据，实际数值与解锁条件以游戏内为准。
        标注「待补齐」的条目信息不完整，待实测或补充资料后完善。
      </p>
    </>
  );
}
