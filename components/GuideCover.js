import IconImg from '@/components/IconImg';

/**
 * 攻略封面模板。
 *
 * 换内容即可 —— 每篇攻略只需在 content/guides.js 里填 cover：
 *   cover: {
 *     kind:  '装备' | '经济' | '运营' | '弈子' | '机制',   // 决定主色 + 几何符号
 *     stat:  { v: '3', k: '件套质变' },                    // 关键数字（扫读锚点）
 *     icons: [{ t: 'item'|'aug'|'champ', n: '死亡之刃' }], // 官方图标，最多 3 个
 *     hook:  '一句话钩子',
 *   }
 *
 * kind 决定品类主色与几何符号（形状不同，色盲也能区分）：
 *   装备=金/菱形  经济=赛季绿/圆  运营=蓝/三角  弈子=紫/方  机制=红/环
 * icons 查不到官方图时自动回落到几何符号，不会出破图。
 *
 * mode:
 *   'panel' 列表卡片左侧的竖排封面块（紧凑，用于扫读）
 *   'hero'  详情页顶部的横幅封面（含大图标 + 关键数字 + 标题）
 */
const KINDS = {
  装备: { cls: 'gc-gold', glyph: 'diamond', glyphLabel: '装备' },
  经济: { cls: 'gc-wild', glyph: 'circle', glyphLabel: '经济' },
  运营: { cls: 'gc-blue', glyph: 'triangle', glyphLabel: '运营' },
  弈子: { cls: 'gc-purple', glyph: 'square', glyphLabel: '弈子' },
  机制: { cls: 'gc-red', glyph: 'ring', glyphLabel: '机制' },
};

const FALLBACK = KINDS.机制;

export default function GuideCover({ cover, index = 0, icons = [], mode = 'panel', title, subtitle }) {
  const meta = KINDS[cover && cover.kind] || FALLBACK;
  const stat = (cover && cover.stat) || {};
  const no = String(index + 1).padStart(2, '0');
  const shown = (icons || []).filter((i) => i && i.src).slice(0, 3);

  const visual = shown.length ? (
    <span className="gc-icons">
      {shown.map((ic, i) => (
        <IconImg key={i} src={ic.src} alt={ic.alt} className="gc-ic" circle={false} />
      ))}
    </span>
  ) : (
    <span className={`gc-glyph gl-${meta.glyph}`} role="img" aria-label={meta.glyphLabel} />
  );

  const statBlock = stat.v ? (
    <div className="gc-stat">
      <span className="gc-stat-v">{stat.v}</span>
      {stat.k ? <span className="gc-stat-k">{stat.k}</span> : null}
    </div>
  ) : null;

  if (mode === 'hero') {
    return (
      <div className={`guide-cover gc-hero ${meta.cls}`}>
        <div className="gc-hero-bar">
          <span className="gc-kind">{cover.kind}</span>
          <span className="gc-no">No.{no}</span>
        </div>
        <div className="gc-hero-body">
          <div className="gc-hero-visual">{visual}</div>
          <div className="gc-hero-text">
            {statBlock}
            {title ? <h1 className="gc-hero-title">{title}</h1> : null}
            {subtitle ? <div className="gc-hero-sub">{subtitle}</div> : null}
            {cover.hook ? <div className="gc-hook">{cover.hook}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`guide-cover gc-panel ${meta.cls}`}>
      <span className="gc-kind">{cover.kind}</span>
      <div className="gc-visual">{visual}</div>
      {statBlock}
      <span className="gc-no">No.{no}</span>
    </div>
  );
}
