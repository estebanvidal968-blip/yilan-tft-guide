import { loadVersions } from '@/lib/loadData';

export default async function VersionsPage() {
  const versions = await loadVersions();
  return (
    <div className="stack">
      <h2 className="section-title">版本日志</h2>
      <p className="section-sub">每个 patch 的改动摘要，当前版本置顶。</p>

      <div className="record-list">
        {versions.map((v) => (
          <a
            key={v.versionId}
            className="record-row"
            href={`/version/${v.patchNo}`}
            style={{ textDecoration: 'none' }}
          >
            <div>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 600, fontSize: '1.05rem' }}>
                {v.name}
              </div>
              <div className="muted" style={{ fontSize: '.85rem' }}>
                {v.releaseDate || v.patchNo}
              </div>
            </div>
            <div className="row" style={{ gap: 10 }}>
              {v.isCurrent && (
                <span className="version-pill" style={{ margin: 0 }}>
                  <span className="dot" />
                  当前
                </span>
              )}
              <span className="muted">查看 →</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
