import { cityKeys, totalKeys } from '@/legends/data/keys';

export const metadata = {
  title: '城邦钥匙 · 海克斯典籍 · 弈览',
  description: '海克斯典籍城邦钥匙全览：秩序钥匙与科技钥匙的解锁条件、属性与效果。',
};

export default function LegendsKeysPage() {
  return (
    <>
      <div className="lg-head">
        <h1 className="lg-title">城邦钥匙全览</h1>
        <p className="lg-sub">
          海克斯典籍的核心机制：每个城邦类羁绊对应两把钥匙。<strong>秩序钥匙</strong>（蓝）前期解锁、负责滚雪球；
          <strong>科技钥匙</strong>（金）要求更高、属于后期质变。钥匙决定了你一整局的玩法方向。
        </p>
        <div className="lg-meta">
          <span>共 {cityKeys.length} 个城邦</span>
          <span>{totalKeys} 把钥匙</span>
        </div>
      </div>

      <div className="lg-grid">
        {cityKeys.map((c) => (
          <article className="lg-card" key={c.city}>
            <h3>
              {c.city}
              <span className="lg-badge draft">{c.alias}</span>
            </h3>
            <p className="lg-hook">{c.unlock}</p>
            <div className="lg-keys">
              {c.keys.map((k, i) => (
                <div className={`lg-key ${k.type}`} key={i}>
                  <div className="lg-key-top">
                    <span className="lg-key-type">{k.type === 'order' ? '秩序' : '科技'}</span>
                    <span className="lg-key-cond">解锁：{k.cond}</span>
                  </div>
                  {k.attr && k.attr !== '—' ? <div className="lg-key-attr">属性：{k.attr}</div> : null}
                  <div className="lg-key-eff">效果：{k.effect}</div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <p className="lg-note">
        资料来源：官方前瞻与公开攻略整理，部分为测试服数据；标注「待游戏内确认」的条目需实测补齐。
        不同资料对个别解锁条件（如比尔吉沃特购买次数 12 / 20 次）存在出入，以游戏内为准。
      </p>
    </>
  );
}
