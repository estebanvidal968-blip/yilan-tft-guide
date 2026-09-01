import CompCard from '@/components/CompCard';
import HexMark from '@/components/HexMark';
import TierTag from '@/components/TierTag';
import AmbientField from '@/components/AmbientField';
import { loadComps, loadVersions } from '@/lib/loadData';
import { SEASON } from '@/lib/season';

export default async function Home() {
  const versions = await loadVersions();
  const comps = await loadComps();
  const current = versions.find((v) => v.isCurrent) || versions[0];
  const list = comps.filter((c) => c.versionId === current.versionId);
  const tiers = ['T0', 'T1', 'T2'];

  return (
    <>
      <section className="hero">
        <AmbientField />
        <HexMark size={320} className="hero-hex" />

        <span className="season-eyebrow">
          S{SEASON.no} 赛季 · 版本 {current.patchNo}
        </span>

        {/* 赛季主题成为 hero 主角：打开页面第一眼就知道这是什么赛季 */}
        <h1 className="season-title">{SEASON.theme}</h1>
        <p className="season-en">{SEASON.themeEn}</p>

        <p className="season-desc">
          金铲铲之战 S{SEASON.no}「{SEASON.theme}」——强势阵容、装备思路、峡谷野怪玩法，抄作业不再慢半拍。
        </p>

        <div className="season-mechanic">
          <svg
            className="sigil"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 21c0-6 3-11 9-13 0 7-4 12-9 13z" />
            <path d="M12 21C9 15 5 12 3 11c1 5 4 9 9 10z" />
            <path d="M12 21v-6" />
          </svg>
          <div className="body">
            <strong>赛季机制 · {SEASON.mechanic.name}</strong>
            <span>{SEASON.mechanic.desc}</span>
          </div>
        </div>

        <span className="version-pill">
          <span className="dot" />
          OP.GG 实时同步 · {current.releaseDate}
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
