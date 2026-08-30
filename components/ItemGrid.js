import IconImg from './IconImg';
import icons from '@/data/icons.json';

export default function ItemGrid({ items }) {
  return (
    <div className="item-grid">
      {items.map((it, i) => (
        <div
          className="item-cell enter"
          key={it.itemId}
          style={{ animationDelay: `${Math.min(i, 14) * 40}ms` }}
        >
          <IconImg src={icons.item?.[it.name]} alt={it.name} className="ic-icon" fallback={it.name.slice(0, 1)} />
          <div className="ic-name">{it.name}</div>
          <div className="ic-tier">{it.tier}</div>
          <a className="cc-link" href={`/item/${it.itemId}`} aria-label={it.name} />
        </div>
      ))}
    </div>
  );
}
