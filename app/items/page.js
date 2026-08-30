import items from '@/data/items.json';
import ItemGrid from '@/components/ItemGrid';

export default function ItemsPage() {
  const completed = items.filter((i) => i.tier === '成装');
  const components = items.filter((i) => i.tier === '散件');

  return (
    <div className="stack">
      <h2 className="section-title">装备库</h2>
      <p className="section-sub">点击装备查看合成路径与反向查询。</p>

      <h3 className="group-title">成装</h3>
      <ItemGrid items={completed} />

      <h3 className="group-title">散件</h3>
      <ItemGrid items={components} />
    </div>
  );
}
