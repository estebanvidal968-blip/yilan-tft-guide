import itemsRaw from '@/data/tft/items.json';
import baseItems from '@/data/items.json';
import icons from '@/data/icons.json';
import ItemsFilter from '@/components/ItemsFilter';

// /items 改版：全量 140 件装备库 + 搜索 + 4 tab 筛选
// 数据：data/tft/items.json (140 件全量) + 顶层 data/items.json (16 件散件种子)

const allTft = itemsRaw || [];

// 神器（纹章）按用户要求从装备库全部移除 —— 不展示、不计数、不进筛选。
// 21 个 /item/[id] 纹章路由仍保留（避免阵容 / 攻略页旧链接 404），仅去掉装备界面入口。
const artifacts = [];

// 光明武器：OP.GG 里 36 件全部无独立样本（sampleCount=0 / avgPlacement=0），
// 因此额外挂一个 baseRef —— 指向原型装备（去掉「光明版」前缀）的数据作为参考。
const radiants = allTft
  .filter((i) => (i.name || '').startsWith('光明版'))
  .map((i) => {
    const baseName = (i.name || '').slice('光明版'.length);
    const base = allTft.find((b) => b.name === baseName && (b.sampleCount || 0) > 0);
    return {
      itemId: i.id,
      name: i.name,
      icon: i.icon || null,
      tier: '光明武器',
      sampleCount: i.sampleCount,
      avgPlacement: i.avgPlacement,
      best: (i.best || []).slice(0, 3),
      baseRef: base ? { name: base.name, avgPlacement: base.avgPlacement } : null,
    };
  });

const completed = allTft
  .filter((i) => i.kind === '成装' && !(i.name || '').startsWith('光明版'))
  .map((i) => ({
    itemId: i.id,
    name: i.name,
    icon: i.icon || null,
    tier: i.kind,
    sampleCount: i.sampleCount,
    avgPlacement: i.avgPlacement,
    best: (i.best || []).slice(0, 3),
  }));

// 散件不在 data/tft/items.json（只有成装/纹章），走顶层 data/items.json。
// S18 共 10 件散件（含金铲铲 / 金锅锅），已全部带 OP.GG 官方图标（10/10 全覆盖），
// icons.json 仅作兜底。
const components = (baseItems || [])
  .filter((i) => i.tier === '散件' || !i.tier)
  .map((i) => ({
    itemId: i.itemId,
    name: i.name,
    icon: i.icon || icons.item?.[i.itemId] || icons.item?.[i.name] || null,
    tier: '散件',
  }));

const shown = radiants.length + completed.length + components.length;

export const metadata = {
  title: '装备库 · 弈览',
  description: `S18 自然之力装备库 ${shown} 件：光明武器 ${radiants.length}、成装 ${completed.length}、散件 ${components.length}。支持名称搜索 + 类别筛选。`,
};

export default function ItemsPage() {
  return (
    <div className="stack">
      <h2 className="section-title">装备库</h2>
      <p className="section-sub">
        S18 共 {shown} 件装备 · 光明武器 {radiants.length} + 成装 {completed.length} + 散件 {components.length}。
        支持名称搜索 + 类别筛选。
      </p>

      <ItemsFilter
        artifacts={artifacts}
        radiants={radiants}
        completed={completed}
        components={components}
      />

      <div className="items-toolbar-row">
        <a href="/play" className="items-tool">
          <strong>🎯 我这局玩什么</strong>
          <span className="muted">3 步决策 · 匹配你的 T0 Top3</span>
        </a>
        <a href="/tools/quiz" className="items-tool">
          <strong>🧠 合成速记小测</strong>
          <span className="muted">10 题热身 · 5 分钟</span>
        </a>
        <a href="/vote" className="items-tool">
          <strong>🗳️ 本周最爱投票</strong>
          <span className="muted">S18 10 套 T0 · 一周一投</span>
        </a>
        <a href="/changelog" className="items-tool">
          <strong>📜 版本归档</strong>
          <span className="muted">每周一图速报</span>
        </a>
      </div>
    </div>
  );
}