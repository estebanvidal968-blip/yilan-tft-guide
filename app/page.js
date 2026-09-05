import CompCard from '@/components/CompCard';
import HexMark from '@/components/HexMark';
import HeroField from '@/components/HeroField';
import VersionOnePager from '@/components/VersionOnePager';
import { loadComps, loadVersions, loadTraits } from '@/lib/loadData';
import itemsTft from '@/data/tft/items.json';
import champs from '@/data/tft/champs.json';
import { SEASON } from '@/lib/season';

export default async function Home() {
  const versions = await loadVersions();
  const comps = await loadComps();
  const current = versions.find((v) => v.isCurrent) || versions[0];
  const list = comps.filter((c) => c.versionId === current.versionId);
  // 按 OP.GG 强度分（opScore）降序排，整页一把排 + 名次
  const ranked = [...list].sort((a, b) => (b.stat?.opScore || 0) - (a.stat?.opScore || 0));

  // 热门搜索：用真实长尾问句把用户导到内页（装备问答页 / 羁绊页），做内链 + 留存。
  // 数据驱动：取「给谁带」数据最全的成装 + 被阵容使用最多的羁绊，避免硬编码 id 出错。
  const hotItems = (itemsTft || [])
    .filter((i) => i.kind === '成装' && (i.best || []).length > 0)
    .sort((a, b) => (b.best || []).length - (a.best || []).length)
    .slice(0, 8)
    .map((i) => ({ label: `S${SEASON.no} ${i.name} 给谁带`, href: `/item/${i.id}` }));
  const hotTraits = (loadTraits() || [])
    .slice(0, 6)
    .map((t) => ({ label: `S${SEASON.no} ${t.name} 羁绊怎么玩`, href: `/trait/${encodeURIComponent(t.name)}` }));
  const hotChamps = (champs || [])
    .filter((c) => (c.sampleCount || 0) > 0)
    .sort((a, b) => (b.sampleCount || 0) - (a.sampleCount || 0))
    .slice(0, 6)
    .map((c) => ({ label: `S${SEASON.no} ${c.name} 出什么装备`, href: `/champion/${c.id}` }));
  const hotSearch = [...hotItems, ...hotTraits, ...hotChamps];

  return (
    <>
      <section className="hero">
        <HeroField />
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

      <section className="hot-search">
        <div className="hot-search-head">
          <span className="hot-search-title">🔥 大家都在搜</span>
          <a className="hot-search-more" href="/trait">全部羁绊 ›</a>
        </div>
        <div className="hot-search-chips">
          {hotSearch.map((h) => (
            <a key={h.href} className="hot-chip" href={h.href}>{h.label}</a>
          ))}
        </div>
      </section>

      {/* 新手/宗师双入口：把不同水平用户导向对应阅读路径，提升留存与转化 */}
      <section className="dual-entry">
        <a className="dual-card dual-beginner" href={`/comp/${ranked[0]?.compId || ''}`}>
          <span className="dual-kicker">新手 · 直接抄</span>
          <span className="dual-title">照着阵容码上分</span>
          <span className="dual-desc">给一套当前版本最强的阵容 + 一键复制阵容码，3 步就能上手，不用懂运营。</span>
          <span className="dual-go">看最强阵容 ›</span>
        </a>
        <a className="dual-card dual-master" href="/guides">
          <span className="dual-kicker">宗师 · 看深度</span>
          <span className="dual-title">运营思路与克制</span>
          <span className="dual-desc">阵容选取信号、符文搭配、节奏与站位细节，把每一套玩到极致。</span>
          <span className="dual-go">读深度攻略 ›</span>
        </a>
      </section>

      <h2 className="section-title">阵容强度榜</h2>
      <p className="section-sub">按 OP.GG 强度分（opScore）从高到低排序 · 点击查看运营思路与克制关系。</p>

      <div className="comp-grid home-grid">
        {ranked.map((c, i) => (
          <CompCard key={c.compId} comp={c} index={i} rank={i + 1} />
        ))}
      </div>

      <VersionOnePager />
    </>
  );
}
