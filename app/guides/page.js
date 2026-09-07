import { guides } from '@/content/guides';
// 本页直接消费 content/guides 全量数组（含运营路线系列）；guides.js 新增条目后须随本页重新构建，否则列表页会停留在旧缓存。
import { loadGuideIcons } from '@/lib/loadData';
import AmbientField from '@/components/AmbientField';
import GuideCover from '@/components/GuideCover';

// 强制动态渲染：列表必须始终反映 content/guides 的当前全量（含运营路线系列）。
// 复用型部署沙箱的 next build 增量缓存可能保留旧版静态预渲染副本（停留在 24 篇），
// 且 CDN 边缘节点对 no-store 响应仍可能残留历史 HTML。force-dynamic 让本页每次请求
// 都从已编译的 guides 模块实时渲染，彻底规避「静态预渲染陈旧」导致的列表缺条目问题。
export const dynamic = 'force-dynamic';

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
            data-slug={g.slug}
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
