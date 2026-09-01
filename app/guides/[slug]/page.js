import { guides, getGuide } from '@/content/guides';
import { notFound } from 'next/navigation';

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

// 装备「突变」标识：按 marks[key]=类型 把命中的装备名包成徽章；markCols 限定作用列
function markCell(text, marks, col, markCols) {
  if (typeof text !== 'string' || !marks) return text;
  if (markCols && !markCols.includes(col)) return text;
  const keys = Object.keys(marks).filter((k) => text.includes(k));
  if (!keys.length) return text;
  keys.sort((a, b) => b.length - a.length);
  const re = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  const out = [];
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <span key={i++} className={`item-flag flag-${marks[m[0]]}`}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
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
                <td key={j} style={{ textAlign: align[j] || 'left' }}>{markCell(cell, block.marks, j, block.markCols)}</td>
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
