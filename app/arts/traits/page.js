import { TRAIT_GROUPS, traitsByGroup, TRAITS } from '@/arts/data/traits';

export const metadata = {
  title: '画之灵 · 羁绊全览与效果 · 弈览',
  description:
    '金铲铲之战画之灵赛季羁绊全览：吉星、灵魂莲华、山海绘卷、青花瓷、天龙之子、夜幽、天将等羁绊的层数效果与打法要点。',
};

export default function ArtsTraits() {
  return (
    <>
      <section className="ar-hero">
        <h1>
          羁绊全览
          <span className="ar-tag">共 {TRAITS.length} 个</span>
        </h1>
        <p style={{ fontSize: 15 }}>
          按「它在队伍里干什么」分成四类：经济与成长、输出核心、前排与防御、功能与专属。
          先想清楚这局要什么，再回头找对应的羁绊，比挨个背数值实用得多。
        </p>
      </section>

      {TRAIT_GROUPS.map((g) => {
        const list = traitsByGroup(g.key);
        if (!list.length) return null;
        return (
          <section className="ar-section" key={g.key}>
            <h2>
              {g.name}
              <span className="ar-chip" style={{ marginLeft: 8 }}>
                {list.length} 个
              </span>
            </h2>
            <p className="ar-sub">{g.desc}</p>
            <div className="ar-grid">
              {list.map((t) => (
                <div className="ar-card" key={t.name}>
                  <h3>
                    {t.name}
                    <span className="ar-chip accent">{t.levels.join(' / ')}</span>
                    {t.tag ? <span className="ar-chip jade">{t.tag}</span> : null}
                  </h3>
                  <p>{t.desc}</p>
                  {t.details && t.details.length > 0 ? (
                    <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                      {t.details.map((d) => (
                        <li
                          key={d}
                          style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ar-sub)' }}
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {t.note ? (
                    <p style={{ color: 'var(--ar-gold)', fontSize: 13 }}>※ {t.note}</p>
                  ) : null}
                  {t.play ? <div className="ar-tip">💡 {t.play}</div> : null}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="ar-note">
        <b>版本提示：</b>
        画之灵为限时返场赛季，<b>吉星、山海绘卷、灵魂莲华、幽魂等羁绊在返场版本有调整</b>；
        具体数值请以游戏内实际描述为准。
      </div>
    </>
  );
}
