import champs from '@/data/tft/champs.json';
import IconImg from '@/components/IconImg';
import { SEASON } from '@/lib/season';

// /champions —— 弈子总览（内链 hub），列出 S18 全部弈子，点击进入出装页。

export const metadata = {
  title: `S${SEASON.no} 弈子出装总览 · 弈览`,
  description: `金铲铲 S${SEASON.no}「${SEASON.theme}」全部 ${champs.length} 个弈子的推荐出装、胜率与平均名次。点击查看每个弈子的主流出装思路。`,
};

export default function ChampionsIndex() {
  const list = [...champs].sort((a, b) => (a.cost || 1) - (b.cost || 1) || a.name.localeCompare(b.name));
  return (
    <div className="stack">
      <h2 className="section-title">S{SEASON.no} 弈子出装总览</h2>
      <p className="section-sub">
        金铲铲之战 S{SEASON.no}「{SEASON.theme}」共 {list.length} 个弈子 · 点击查看每个弈子的主流出装、胜率与平均名次。
      </p>

      <div className="champ-grid">
        {list.map((c) => {
          const cost = c.cost || 1;
          return (
            <a key={c.id} href={`/champion/${c.id}`} className="champ-cell">
              <IconImg src={c.icon} alt={c.name} fallback={c.name.slice(0, 1)} className="champ-cell-ic" />
              <span className="champ-cell-name">{c.name}</span>
              <span className="champ-cell-cost" style={{ color: `var(--cost${cost})` }}>{cost} 费</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
