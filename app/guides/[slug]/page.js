import { guides, getGuide } from '@/content/guides';
import { notFound } from 'next/navigation';
import IconImg from '@/components/IconImg';
import { loadItemIcons } from '@/lib/loadData';

// 装备官方图标（140/140 全覆盖），构建期一次性读入，不进前端包
const ITEM_ICONS = loadItemIcons();

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }) {
  const g = getGuide(params.slug);
  if (!g) return { title: '攻略未找到 · 弈览' };
  return {
    title: `${g.title} · 弈览`,
    description: g.summary,
  };
}

const ICON_KEYS = Object.keys(ITEM_ICONS);

// 表格单元格渲染：一次正则扫描同时处理「装备官方图标」与「突变徽章」。
//   iconCols            —— 该列出现的装备名配上官方图标（140/140 覆盖）
//   marks / markCols    —— 该列命中的装备名包成徽章（必抢 / 慎选 / 奇效 / 特殊）
// 二者命中同一个词时合并渲染：[徽章标签] [图标] 装备名
function renderCell(text, block, col) {
  if (typeof text !== 'string') return text;
  const useIcon = Array.isArray(block.iconCols) && block.iconCols.includes(col);
  const useMark = Boolean(block.marks) && Array.isArray(block.markCols) && block.markCols.includes(col);
  if (!useIcon && !useMark) return text;

  // 先用 includes 做廉价过滤，再只对命中的词建正则 —— 避免每个单元格都编译 140 词的巨型正则
  const keys = new Set();
  if (useMark) Object.keys(block.marks).forEach((k) => text.includes(k) && keys.add(k));
  if (useIcon) ICON_KEYS.forEach((k) => text.includes(k) && keys.add(k));
  if (!keys.size) return text;

  const all = Array.from(keys).sort((a, b) => b.length - a.length); // 长词优先，避免子串误判
  const re = new RegExp(all.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const out = [];
  let last = 0;
  let i = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const icon = useIcon ? ITEM_ICONS[m[0]] : null;
    const mark = useMark ? block.marks[m[0]] : null;
    const body = (
      <>
        {icon ? <IconImg src={icon} alt={m[0]} className="cell-ic" circle={false} /> : null}
        {m[0]}
      </>
    );
    if (mark) out.push(<span key={i++} className={`item-flag flag-${mark}`}>{body}</span>);
    else if (icon) out.push(<span key={i++} className="item-ic">{body}</span>);
    else out.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : text;
}

// 按 block 类型渲染，保持无 Markdown 依赖
function Block({ block }) {
  switch (block.type) {
    case 'p':
      return <p className="guide-p">{block.text}</p>;

    case 'list':
      return (
        <ul className="guide-list-block">
          {block.items.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      );

    case 'steps':
      return (
        <ol className="guide-steps">
          {block.items.map((t, i) => (
            <li key={i}>
              <span className="step-no">{i + 1}</span>
              <span className="step-text">{t}</span>
            </li>
          ))}
        </ol>
      );

    case 'table': {
      const align = block.align || [];
      return (
        <div className="guide-table-wrap">
          <table className="guide-table">
            <thead>
              <tr>
                {block.headers.map((h, j) => (
                  <th key={h} style={{ textAlign: align[j] || 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} data-label={block.headers[j]} style={{ textAlign: align[j] || 'left' }}>{renderCell(cell, block, j)}</td>
              ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'callout':
      return (
        <div className={`guide-callout tone-${block.tone || 'info'}`}>
          {block.title ? <strong className="callout-title">{block.title}</strong> : null}
          <span className="callout-text">{block.text}</span>
        </div>
      );

    default:
      return null;
  }
}

export default function GuideDetailPage({ params }) {
  const g = getGuide(params.slug);
  if (!g) notFound();

  return (
    <article className="guide-article">
      <a className="back-link" href="/guides">← 返回攻略</a>

      <header className="guide-head">
        <span className="guide-season">{g.season}</span>
        <h1>{g.title}</h1>
        <p className="guide-sub">{g.subtitle}</p>
        <div className="guide-meta">
          <div className="kv">
            {g.tags.map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
          <span className="muted" style={{ fontSize: '.85rem' }}>
            更新 {g.updatedAt} · 约 {g.readMinutes} 分钟
          </span>
        </div>
      </header>

      <p className="guide-lead">{g.summary}</p>

      {g.sections.map((s, i) => (
        <section key={i} className="guide-section">
          <h2>{s.heading}</h2>
          {s.blocks.map((b, j) => (
            <Block key={j} block={b} />
          ))}
        </section>
      ))}

      <footer className="guide-foot">
        <span className="muted">
          {g.dataNote ||
            '数据来源：站点 OP.GG 实战阵容库与 S18 赛季元数据；机制随版本调整，以游戏内实际为准。'}
        </span>
      </footer>
    </article>
  );
}
