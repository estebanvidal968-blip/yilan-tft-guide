import { keyGear, itemTable, principles } from '@/legends/data/items';

export const metadata = {
  title: '装备 · 海克斯典籍 · 弈览',
  description: '海克斯典籍装备攻略：钥匙佩戴原则、常规装备速查与配装思路。',
};

export default function LegendsItemsPage() {
  return (
    <>
      <div className="lg-head">
        <h1 className="lg-title">装备攻略</h1>
        <p className="lg-sub">{keyGear.intro}</p>
      </div>

      <section className="lg-block">
        <h2>钥匙佩戴四原则</h2>
        <div className="lg-list">
          {keyGear.rules.map((r, i) => (
            <div className="lg-row" key={i}>
              <span className="lg-row-t">{r.title}</span>
              <span className="lg-row-d">{r.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {itemTable.map((g) => (
        <section className="lg-block" key={g.cat}>
          <h2>{g.cat}</h2>
          <div className="lg-list">
            {g.items.map((it) => (
              <div className="lg-row" key={it.name}>
                <span className="lg-row-t">{it.name}</span>
                <span className="lg-row-d">
                  {it.desc}
                  <br />
                  <span style={{ color: 'var(--mute)', fontSize: '0.84rem' }}>
                    常见佩戴：{it.holders}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="lg-block">
        <h2>配装思路</h2>
        <div className="lg-list">
          {principles.map((p, i) => (
            <div className="lg-row" key={i}>
              <span className="lg-row-t">{p.title}</span>
              <span className="lg-row-d">{p.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="lg-note">
        装备效果描述为通用认知整理，具体数值以游戏内为准。钥匙部分请配合「城邦钥匙」页一起看——
        先确定开哪把钥匙，再按上面的原则分配装备格。
      </p>
    </>
  );
}
