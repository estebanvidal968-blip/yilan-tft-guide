import { loadComps, loadVersions } from '@/lib/loadData';
import TierTag from '@/components/TierTag';
import StationMap from '@/components/StationMap';
import FavoriteButton from '@/components/FavoriteButton';
import LikeButton from '@/components/LikeButton';
import CommentSection from '@/components/CommentSection';
import IconImg from '@/components/IconImg';
import AdSlot from '@/components/AdSlot';
import icons from '@/data/icons.json';

export default async function CompDetail({ params }) {
  const comps = await loadComps();
  const versions = await loadVersions();
  const comp = comps.find((c) => c.compId === params.id);
  if (!comp) return <p className="muted">未找到该阵容（{params.id}）。</p>;

  const ver = versions.find((v) => v.versionId === comp.versionId);
  const positions = comp.positions || [];
  const roster = comp.roster && comp.roster.length ? comp.roster : positions;

  // 费用 / 站位 映射（positions 才有坐标与费用，roster 可能只有名字）
  const costMap = {};
  positions.forEach((p) => {
    if (p.champ && p.cost != null) costMap[p.champ] = p.cost;
  });
  const ROW_LABEL = ['第 1 排 · 前排', '第 2 排', '第 3 排', '第 4 排 · 后排'];
  const byRow = {};
  let hasStation = false;
  roster.forEach((u) => {
    const pos = positions.find((p) => p.champ === u.champ);
    const row = pos ? pos.row : null;
    if (row != null) hasStation = true;
    const rec = {
      champ: u.champ,
      carry: pos ? !!pos.carry : !!u.carry,
      cost: pos ? pos.cost : u.cost || costMap[u.champ] || 1,
      stars: pos ? pos.stars || 1 : u.stars || 1,
      items: pos ? pos.items || [] : u.items || [],
    };
    (byRow[row] == null ? (byRow[row] = []) : byRow[row]).push(rec);
  });
  const groupKeys = hasStation
    ? [0, 1, 2, 3].filter((r) => byRow[r] && byRow[r].length)
    : [null].filter((r) => byRow[r]);

  const panels = [
    {
      title: `上场棋子（${roster.length} 人口）`,
      body: (
        <div className="roster">
          {groupKeys.map((rk) => (
            <div className="roster-group" key={rk ?? 'all'}>
              {hasStation && (
                <div className="rg-head">
                  <span>{ROW_LABEL[rk]}</span>
                  <span className="line" />
                </div>
              )}
              {byRow[rk].map((u) => (
                <div className={`rg-row ${u.carry ? 'is-carry' : ''}`} key={u.champ}>
                  <span className={`unit-token ut-sm cost${u.cost || 1}`}>
                    <IconImg src={icons.champion?.[u.champ]} alt={u.champ} fallback={u.champ.slice(0, 1)} />
                  </span>
                  <span className="rg-name">
                    {u.champ}
                    {u.carry && <em>C</em>}
                  </span>
                  <span className="rg-stars">{'★'.repeat(u.stars || 1)}</span>
                  {u.items?.length > 0 && (
                    <span className="rg-items">
                      {u.items.map((it) => (
                        <IconImg key={it} src={icons.item?.[it]} alt={it} className="ur-it" circle={false} fallback={it.slice(0, 1)} />
                      ))}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '羁绊',
      body: (
        <div className="kv">
          {comp.traits.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      ),
    },
    comp.coreItems?.length
      ? {
          title: '核心装备',
          body: (
            <div className="kv">
              {comp.coreItems.map((i) => (
                <span key={i} className="tag tag-with-icon">
                  <IconImg src={icons.item?.[i]} alt={i} className="tag-ic" fallback={i.slice(0, 1)} />
                  {i}
                </span>
              ))}
            </div>
          ),
        }
      : null,
    comp.earlyGame || comp.midGame || comp.lateGame
      ? {
          title: '运营节奏',
          body: (
            <>
              {comp.earlyGame && <p>前期：{comp.earlyGame}</p>}
              {comp.midGame && <p>中期：{comp.midGame}</p>}
              {comp.lateGame && <p>后期：{comp.lateGame}</p>}
            </>
          ),
        }
      : null,
    comp.counters?.length || comp.counteredBy?.length
      ? {
          title: '克制关系',
          body: (
            <>
              <p>克制：{comp.counters.length ? comp.counters.join('、') : '—'}</p>
              <p>被克：{comp.counteredBy.length ? comp.counteredBy.join('、') : '—'}</p>
            </>
          ),
        }
      : null,
    comp.selectionGuide
      ? { title: '阵容选取 · 符文搭配', body: <p>{comp.selectionGuide}</p> }
      : null,
    comp.pickTips
      ? { title: '选奕子小技巧', body: <p>{comp.pickTips}</p> }
      : null,
    { title: 'AI 点评', body: <p>{comp.aiComment}</p> },
    { title: '玩家评论', body: <CommentSection compId={comp.compId} /> },
  ].filter(Boolean);

  return (
    <div className="stack">
      <a className="back-link" href="/">
        ← 返回阵容
      </a>

      <div className="detail-head">
        <h1>{comp.name}</h1>
        <TierTag tier={comp.tier} />
        <span className="season-chip">
          金铲铲 <b>S18 · 自然之力</b>
        </span>
        <LikeButton compId={comp.compId} />
        <FavoriteButton type="comp" id={comp.compId} />
      </div>
      <div className="detail-meta">
        {ver?.name} · {ver?.patchNo} · 来源 {comp.source}
      </div>

      <div className="detail-grid">
        <StationMap positions={positions} roster={roster} tip={comp.positionTip || ''} />
        <div className="stack">
          {panels.map((p, i) => (
            <div className="panel enter" key={p.title} style={{ animationDelay: `${i * 60}ms` }}>
              <h3>{p.title}</h3>
              {p.body}
            </div>
          ))}
        </div>
      </div>

      <AdSlot slot="detail" className="ad-detail" />
    </div>
  );
}
