import { SEASON, REALM_INTRO, REALMS, ENCOUNTERS, PACING } from '@/arts/data/mechanics';

export const metadata = {
  title: '画之灵 · 赛季总览与玩法机制 · 弈览',
  description:
    '金铲铲之战画之灵赛季（18.3 限时返场）总览：绘境格全部效果、狂风奇遇与发财奇遇规则、三个阶段的运营节奏建议。',
};

const TYPE_CLASS = { 战力: 'accent', 经济: 'gold', 陷阱: 'jade' };

export default function ArtsHome() {
  return (
    <>
      <section className="ar-hero">
        <h1>
          {SEASON.name}
          <span className="ar-tag">{SEASON.version}</span>
        </h1>
        <p style={{ fontSize: 15 }}>{SEASON.intro}</p>
      </section>

      <section className="ar-section">
        <h2>赛季要点</h2>
        <p className="ar-sub">
          {SEASON.origin} · {SEASON.returnDate} · 「{SEASON.tagline}」
        </p>
        <ul className="ar-list">
          {SEASON.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </section>

      <section className="ar-section">
        <h2>{REALM_INTRO.title}</h2>
        <p className="ar-sub">{REALM_INTRO.summary}</p>
        <ul className="ar-list">
          {REALM_INTRO.keys.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
        <div className="ar-grid" style={{ marginTop: 14 }}>
          {REALMS.map((r) => (
            <div className="ar-card" key={r.name}>
              <h3>
                {r.name}
                <span className={'ar-chip ' + (TYPE_CLASS[r.type] || '')}>{r.type}</span>
              </h3>
              <p>{r.desc}</p>
              <div className="ar-tip">💡 {r.tip}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="ar-section">
        <h2>奇遇系统</h2>
        <p className="ar-sub">{ENCOUNTERS.intro}</p>

        <div className="ar-grid">
          <div className="ar-card">
            <h3>
              {ENCOUNTERS.normal.name}
              <span className="ar-chip">经典</span>
            </h3>
            <p>{ENCOUNTERS.normal.desc}</p>
          </div>
          <div className="ar-card">
            <h3>
              {ENCOUNTERS.fortune.name}
              <span className="ar-chip gold">开局福利</span>
            </h3>
            <p>{ENCOUNTERS.fortune.desc}</p>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="ar-card">
            <h3>
              {ENCOUNTERS.wind.name}
              <span className="ar-chip accent">颠覆规则</span>
            </h3>
            <p>{ENCOUNTERS.wind.desc}</p>
            <table className="ar-table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th style={{ width: 110 }}>效果</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {ENCOUNTERS.wind.effects.map((e) => (
                  <tr key={e.name}>
                    <td>
                      <b>{e.name}</b>
                    </td>
                    <td>{e.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="ar-section">
        <h2>玩法推荐：三个阶段怎么打</h2>
        <p className="ar-sub">绘境格分三次给出（2-5 / 3-5 / 4-5），节奏取舍比常规赛季更重要。</p>
        <div className="ar-grid">
          {PACING.map((p) => (
            <div className="ar-card" key={p.phase}>
              <h3>
                {p.phase}
                <span className="ar-chip jade">{p.focus}</span>
              </h3>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {p.points.map((pt) => (
                  <li key={pt} style={{ fontSize: 13.5, lineHeight: 1.75, color: 'var(--ar-sub)' }}>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="ar-note">
        <b>版本提示：</b>
        画之灵为限时返场赛季，绘境格与羁绊数值会随版本微调，
        <b>具体效果请以游戏内实际描述为准</b>。羁绊与阵容分别见上方「羁绊」「阵容」页。
      </div>
    </>
  );
}
