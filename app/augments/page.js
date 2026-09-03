import augments from '@/data/tft/augments.json';
import IconImg from '@/components/IconImg';
import { SEASON } from '@/lib/season';

// /augments —— 符文总览（内链 hub），按阶分组列出 S18 全部符文。

const TIER_ORDER = [
  { key: 'prism', label: '棱彩' },
  { key: 'gold', label: '金色' },
  { key: 'silver', label: '银色' },
];

export const metadata = {
  title: `S${SEASON.no} 强化符文总览 · 弈览`,
  description: `金铲铲 S${SEASON.no}「${SEASON.theme}」全部 ${augments.length} 个强化符文（棱彩/金色/银色），点击查看每个符文的效果与用法。`,
};

export default function AugmentsIndex() {
  const groups = TIER_ORDER.map((t) => ({
    ...t,
    list: augments.filter((a) => a.tierKey === t.key),
  })).filter((g) => g.list.length);

  return (
    <div className="stack">
      <h2 className="section-title">S{SEASON.no} 强化符文总览</h2>
      <p className="section-sub">
        金铲铲之战 S{SEASON.no}「{SEASON.theme}」共 {augments.length} 个强化符文 · 按阶分组 · 点击查看效果与用法。
      </p>

      {groups.map((g) => (
        <div className="aug-group" key={g.key}>
          <h3 className="aug-group-title">{g.label}阶 · {g.list.length}</h3>
          <div className="aug-grid">
            {g.list.map((a) => (
              <a key={a.id} href={`/augment/${a.id}`} className="aug-cell" title={a.desc}>
                <IconImg src={a.icon} alt={a.name} fallback={a.name.slice(0, 1)} className="aug-cell-ic" />
                <span className="aug-cell-name">{a.name}</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
