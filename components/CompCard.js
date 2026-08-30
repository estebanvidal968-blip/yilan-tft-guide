import TierTag from './TierTag';
import IconImg from './IconImg';
import FavoriteButton from './FavoriteButton';
import LikeButton from './LikeButton';
import icons from '@/data/icons.json';

export default function CompCard({ comp, index = 0 }) {
  const carry = comp.positions?.find((p) => p.carry);
  const costOf = {};
  (comp.positions || []).forEach((p) => {
    if (p.champ && p.cost != null) costOf[p.champ] = p.cost;
  });

  return (
    <article className="comp-card enter" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="cc-head">
        <span className="cc-name">{comp.name}</span>
        <TierTag tier={comp.tier} />
      </div>
      <div className="cc-champs">{comp.coreChampions.join(' · ')}</div>
      <div className="cc-champ-icons">
        {comp.coreChampions.map((c) => (
          <span key={c} className={`unit-token ut-md cost${costOf[c] || 1}`}>
            <IconImg src={icons.champion?.[c]} alt={c} fallback={c.slice(0, 1)} />
            <span className="badge">S18</span>
          </span>
        ))}
      </div>
      <div className="cc-traits">
        {comp.traits.map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
      </div>
      <p className="cc-comment">{comp.aiComment}</p>
      {carry && (
        <div className="cc-carry">
          <span className="cc-carry-lead">
            <span className={`unit-token ut-sm cost${costOf[carry.champ] || 1}`}>
              <IconImg src={icons.champion?.[carry.champ]} alt={carry.champ} fallback={carry.champ.slice(0, 1)} />
            </span>
            C 位 <strong>{carry.champ}</strong>
          </span>
          <span className="cc-carry-items">
            {carry.items?.slice(0, 3).map((it) => (
              <IconImg key={it} src={icons.item?.[it]} alt={it} className="cc-ii" circle={false} fallback={it.slice(0, 1)} />
            ))}
            {carry.items?.slice(0, 3).join(' / ')}
          </span>
        </div>
      )}
      <div className="cc-actions">
        <LikeButton compId={comp.compId} />
        <FavoriteButton type="comp" id={comp.compId} />
      </div>
      <a className="cc-link" href={`/comp/${comp.compId}`} aria-label={comp.name} />
    </article>
  );
}
