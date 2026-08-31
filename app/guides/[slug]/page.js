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

    case 'table':
      return (
        <div className="guide-table-wrap">
          <table className="guide-table">
            <thead>
              <tr>
                {block.headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

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
          数据来源：官方赛季公告与设计师访谈 + 社区攻略整理。机制可能随版本调整，以游戏内实际为准。
        </span>
      </footer>
    </article>
  );
}
