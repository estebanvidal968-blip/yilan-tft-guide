import HexBoard from './HexBoard';
import IconImg from './IconImg';
import icons from '@/data/icons.json';

export default function StationMap({ positions = [], roster = [], tip = '' }) {
  if (!positions.length) {
    return (
      <div className="station-map">
        <p className="sm-note">该阵容暂无标准站位数据。</p>
        {roster.length > 0 && (
          <div className="sm-roster">
            {roster.map((u) => {
              const pos = positions.find((p) => p.champ === u.champ);
              const cost = pos ? pos.cost : u.cost || 1;
              const carry = pos ? !!pos.carry : !!u.carry;
              return (
                <span key={u.champ} className={carry ? 'ur-unit is-carry' : 'ur-unit'}>
                  <span className={`unit-token ut-sm cost${cost}`}>
                    <IconImg
                      src={icons.champion?.[u.champ]}
                      alt={u.champ}
                      fallback={u.champ.slice(0, 1)}
                    />
                    <span className="badge">S18</span>
                  </span>
                  {u.champ}
                  {carry && <em>C</em>}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  return <HexBoard positions={positions} tip={tip} />;
}
