import IconImg from './IconImg';
import icons from '@/data/icons.json';

// 阵容「完整整图」：把本套全部上场棋子排成品牌化六边棋盘网格，
// 费用色环 + 主C 金环高亮，一眼识别本套阵容构成。
// 野怪 / TFT 原创单位无官方图标时，IconImg 自动降级为六边形首字 token，不破图。
// 纯展示组件（无客户端状态），可在服务端组件（CompCard / 详情页）直接渲染。
export default function CompLineupIcon({ comp, showNames = true, compact = false }) {
  const positions = comp.positions || [];
  const roster = comp.roster && comp.roster.length ? comp.roster : positions;

  const costMap = {};
  positions.forEach((p) => {
    if (p.champ && p.cost != null) costMap[p.champ] = p.cost;
  });

  const seen = new Set();
  const units = [];
  for (const u of roster) {
    if (seen.has(u.champ)) continue;
    seen.add(u.champ);
    const pos = positions.find((p) => p.champ === u.champ);
    units.push({
      champ: u.champ,
      carry: pos ? !!pos.carry : !!u.carry,
      cost: pos ? pos.cost : u.cost || costMap[u.champ] || 1,
      stars: pos ? pos.stars || 1 : u.stars || 1,
    });
  }
  // 主C 置顶，其余按费用降序
  units.sort((a, b) => (b.carry - a.carry) || (b.cost - a.cost) || a.champ.localeCompare(b.champ));

  return (
    <div className={`comp-lineup${compact ? ' is-compact' : ''}`} aria-label={`${comp.name} 完整阵容`}>
      <div className="cl-grid">
        {units.map((u) => (
          <div className={`cl-cell${u.carry ? ' is-carry' : ''}`} key={u.champ}>
            <span className={`unit-token ut-md cost${u.cost}${u.carry ? ' is-carry' : ''}`}>
              <IconImg src={icons.champion?.[u.champ]} alt={u.champ} fallback={u.champ.slice(0, 1)} />
            </span>
            {showNames && <span className="cl-name">{u.champ}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
