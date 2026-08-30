import CompCard from '@/components/CompCard';
import HexMark from '@/components/HexMark';
import TierTag from '@/components/TierTag';
import { loadComps, loadVersions } from '@/lib/loadData';

export default async function Home() {
  const versions = await loadVersions();
  const comps = await loadComps();
  const current = versions.find((v) => v.isCurrent) || versions[0];
  const list = comps.filter((c) => c.versionId === current.versionId);
  const tiers = ['T0', 'T1', 'T2'];

  return (
    <>
      <section className="hero">
        <HexMark size={320} className="hero-hex" />
        <h1>
          版本同步的
          <br />
          金铲铲攻略
        </h1>
        <p>金铲铲之战 S18「自然之力」——强势阵容、装备思路、峡谷野怪玩法，抄作业不再慢半拍。</p>
        <span className="version-pill">
          <span className="dot" />
          当前版本 {current.name}（{current.patchNo}）
        </span>
      </section>

      <h2 className="section-title">阵容速查</h2>
      <p className="section-sub">按强度分档，点击查看运营思路与克制关系。</p>

      {tiers.map((t) => {
        const group = list.filter((c) => c.tier === t);
        if (!group.length) return null;
        return (
          <div key={t} style={{ marginBottom: 30 }}>
            <div className="row" style={{ marginBottom: 12 }}>
              <TierTag tier={t} />
              <span className="muted" style={{ fontSize: '.85rem' }}>
                {group.length} 套
              </span>
            </div>
            <div className="comp-grid home-grid">
              {group.map((c, i) => (
                <CompCard key={c.compId} comp={c} index={i} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
