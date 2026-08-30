import { loadComps, loadVersions } from '@/lib/loadData';
import CompCard from '@/components/CompCard';

export default async function VersionDetail({ params }) {
  const versions = await loadVersions();
  const comps = await loadComps();
  const ver = versions.find((v) => v.patchNo === params.no);
  if (!ver) return <p className="muted">未找到该版本（{params.no}）。</p>;

  const list = comps.filter((c) => c.versionId === ver.versionId);

  return (
    <div className="stack">
      <a className="back-link" href="/versions">
        ← 返回版本
      </a>

      <div className="detail-head">
        <h1>{ver.name}</h1>
        {ver.isCurrent && (
          <span className="version-pill" style={{ margin: 0 }}>
            <span className="dot" />
            当前版本
          </span>
        )}
      </div>
      <div className="detail-meta">
        {ver.patchNo} · {ver.releaseDate || '—'}
      </div>

      <div className="panel">
        <h3>版本摘要</h3>
        <p>{ver.summary || '（暂无摘要，运行同步脚本后将由 AI 生成。）'}</p>
      </div>

      <h2 className="section-title">本版本阵容</h2>
      <div className="comp-grid">
        {list.map((c) => (
          <CompCard key={c.compId} comp={c} />
        ))}
      </div>
    </div>
  );
}
