import { loadTraits } from '@/lib/loadData';
import { SEASON } from '@/lib/season';

// /trait —— 羁绊总览（内链 hub），列出 S18 全部羁绊及被多少阵容使用。

export const metadata = {
  title: `S${SEASON.no} 羁绊总览 · 弈览`,
  description: `金铲铲 S${SEASON.no}「${SEASON.theme}」全部羁绊一览：每个羁绊被多少套强势阵容使用，点击查看该羁绊的阵容搭配与运营思路。`,
};

export default function TraitIndex() {
  const traits = loadTraits();
  const maxCount = traits.reduce((m, t) => Math.max(m, t.count), 1);

  return (
    <div className="stack">
      <h2 className="section-title">S{SEASON.no} 羁绊总览</h2>
      <p className="section-sub">
        金铲铲之战 S{SEASON.no}「{SEASON.theme}」共 {traits.length} 个羁绊 · 按被阵容使用次数排序 · 点击查看该羁绊的阵容搭配。
      </p>

      <div className="trait-cloud">
        {traits.map((t) => {
          const big = t.count >= maxCount * 0.6;
          return (
            <a
              key={t.name}
              href={`/trait/${encodeURIComponent(t.name)}`}
              className={`trait-pill ${big ? 'is-hot' : ''}`}
              title={`${t.count} 套阵容在用`}
            >
              <span className="tp-name">{t.name}</span>
              <span className="tp-count">{t.count}</span>
            </a>
          );
        })}
      </div>

      <div className="items-toolbar-row">
        <a href="/" className="items-tool">
          <strong>🏆 阵容强度榜</strong>
          <span className="muted">T0 / T1 一眼看清</span>
        </a>
        <a href="/items" className="items-tool">
          <strong>🗡️ 装备库</strong>
          <span className="muted">成装 / 光明 / 散件</span>
        </a>
        <a href="/tools/quiz" className="items-tool">
          <strong>🧠 装备小测</strong>
          <span className="muted">10 题测熟练度</span>
        </a>
      </div>
    </div>
  );
}
