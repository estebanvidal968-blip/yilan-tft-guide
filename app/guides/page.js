import { guides } from '@/content/guides';
import { loadGuideIcons } from '@/lib/loadData';
import AmbientField from '@/components/AmbientField';
import GuideCover from '@/components/GuideCover';

// 封面用的官方图标（装备140 + 符文283 + 棋子55），构建期一次性读入，不进前端包
const GUIDE_ICONS = loadGuideIcons();

function resolveCoverIcons(cover) {
  return ((cover && cover.icons) || [])
    .map((ic) => ({ src: GUIDE_ICONS[`${ic.t}:${ic.n}`] || '', alt: ic.n }))
    .filter((x) => x.src);
}

export const metadata = {
  title: '攻略 · 弈览',
  description: '金铲铲之战 S18「自然之力」版本机制攻略：自然仙灵、变形术、追三技巧。',
};

export default function GuidesPage() {
  return (
    <>
      <div className="guides-head">
        <AmbientField count={14} />
        <h1 className="section-title">攻略</h1>
        <p className="section-sub">
          版本机制与进阶技巧，讲清「怎么来的」和「怎么做到」。当前 {guides.length} 篇。
        </p>
      </div>

      <div className="guide-list">
        {guides.map((g, i) => (
          <a
            key={g.slug}
            className="guide-card enter"
            href={`/guides/${g.slug}`}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <GuideCover
              cover={g.cover}
              index={i}
              icons={resolveCoverIcons(g.cover)}
              mode="panel"
            />
            <div className="guide-card-body">
              <div className="guide-card-head">
                <h2>{g.title}</h2>
                <span className="guide-season">{g.season}</span>
              </div>
              <p className="guide-card-sub">{g.cover?.hook || g.subtitle}</p>
              <p className="guide-card-summary">{g.summary}</p>
              <div className="guide-card-foot">
                <div className="kv">
                  {g.tags.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
                <span className="muted" style={{ fontSize: '.82rem' }}>
                  更新 {g.updatedAt} · 约 {g.readMinutes} 分钟
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
