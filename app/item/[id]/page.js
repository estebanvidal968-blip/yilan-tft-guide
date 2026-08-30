import items from '@/data/items.json';
import FavoriteButton from '@/components/FavoriteButton';

export default function ItemDetail({ params }) {
  const item = items.find((i) => i.itemId === params.id);
  if (!item) return <p className="muted">未找到该装备。</p>;

  const byId = Object.fromEntries(items.map((i) => [i.itemId, i]));
  const from = item.buildFrom.map((id) => byId[id]).filter(Boolean);
  const to = item.recipe.map((id) => byId[id]).filter(Boolean);

  return (
    <div className="stack">
      <a className="back-link" href="/items">
        ← 返回装备
      </a>

      <div className="detail-head">
        <h1>{item.name}</h1>
        <span className="tag">{item.tier}</span>
        <FavoriteButton type="item" id={item.itemId} />
      </div>

      <div className="panel">
        <h3>合成路径（由以下合成）</h3>
        {from.length ? (
          <div className="kv">
            {from.map((i) => (
              <a key={i.itemId} className="tag" href={`/item/${i.itemId}`}>
                {i.name}
              </a>
            ))}
          </div>
        ) : (
          <p className="muted">基础散件，无可合成来源。</p>
        )}
      </div>

      <div className="panel">
        <h3>可合成（反向查询）</h3>
        {to.length ? (
          <div className="kv">
            {to.map((i) => (
              <a key={i.itemId} className="tag" href={`/item/${i.itemId}`}>
                {i.name}
              </a>
            ))}
          </div>
        ) : (
          <p className="muted">该装备为终端成装。</p>
        )}
      </div>
    </div>
  );
}
