import { COMPS, COMP_STYLES, compsByStyle } from '@/arts/data/comps';

export const metadata = {
  title: '画之灵 · 阵容推荐（返场版本）· 弈览',
  description:
    '金铲铲之战画之灵赛季阵容推荐：艾希、莉莉娅、巴德、凯隐、厄斐琉斯、拉露恩、莫甘娜、卡莎、辛德拉等体系的羁绊搭配、装备与玩法要点。',
};

export default function ArtsComps() {
  return (
    <>
      <section className="ar-hero">
        <h1>
          阵容推荐
          <span className="ar-tag">返场版本 · {COMPS.length} 套</span>
        </h1>
        <p style={{ fontSize: 15 }}>
          按打法类型分组，每套都写明羁绊组合、核心棋子与装备、以及这套强在哪、怕什么。
          画之灵是限时返场赛季，环境变化快，建议先看「这套的赢法与短板」再决定要不要硬冲。
        </p>
      </section>

      {COMP_STYLES.map((style) => {
        const list = compsByStyle(style);
        if (!list.length) return null;
        return (
          <section className="ar-section" key={style}>
            <h2>
              {style}
              <span className="ar-chip" style={{ marginLeft: 8 }}>
                {list.length} 套
              </span>
            </h2>
            <div className="ar-grid">
              {list.map((c) => (
                <div className="ar-card" key={c.slug}>
                  <h3>
                    {c.name}
                    <span className="ar-chip accent">{c.tier}</span>
                    <span className="ar-chip">难度 {c.difficulty}</span>
                  </h3>
                  <p style={{ color: 'var(--ar-ink)', fontSize: 13.5 }}>
                    <b>羁绊：</b>
                    {c.traits.join(' · ')}
                  </p>
                  <table className="ar-table" style={{ marginTop: 10 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 62 }}>定位</th>
                        <th style={{ width: 92 }}>棋子</th>
                        <th>推荐装备</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.carries.map((x) => (
                        <tr key={x.role + x.unit}>
                          <td>{x.role}</td>
                          <td>
                            <b>{x.unit}</b>
                          </td>
                          <td>{x.items.join(' / ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ marginTop: 10 }}>{c.play}</p>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="ar-note">
        <b>版本提示：</b>
        画之灵为限时返场赛季，版本平衡调整频繁，阵容强度与装备优先级随时可能变化。
        建议先把一套练熟、摸清节奏，再根据当天环境灵活换牌。
      </div>
    </>
  );
}
