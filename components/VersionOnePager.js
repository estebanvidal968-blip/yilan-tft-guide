import itemsTft from '@/data/tft/items.json';
import comps from '@/data/comps.opgg.json';
import IconImg from './IconImg';
import Link from 'next/link';

// /changelog · /  页面底部「版本速报一图卡」
// 数据：最强 3 件装（avgPlacement 最小） + 最强 3 套阵容（opScore 最大） + 一句话环境判断

function top3Items() {
  return [...(itemsTft || [])]
    .filter((i) => (i.sampleCount || 0) >= 50000)
    .sort((a, b) => (a.avgPlacement || 99) - (b.avgPlacement || 99))
    .slice(0, 3);
}

function top3Comps() {
  return [...(comps || [])]
    .sort((a, b) => (b.stat?.opScore || 0) - (a.stat?.opScore || 0))
    .slice(0, 3);
}

function envOneLiner(comps) {
  const ad = comps.filter((c) => /死亡之刃|最后的轻语|巨人杀手|海妖之怒|无尽之刃|鬼索的狂暴之刃/.test((c.coreItems || []).join(','))).length;
  const ap = comps.filter((c) => /大天使之杖|蓝霸符|海克斯科技枪刃|珠光护手|朔极之矛|强袭者的链枷|莫雷洛秘典|灭世者的死亡之帽|虚空之杖/.test((c.coreItems || []).join(','))).length;
  const tank = comps.filter((c) => /石像鬼石板甲|振奋盔甲|狂徒铠甲/.test((c.coreItems || []).join(','))).length;
  if (ap >= ad + 1 && ap >= tank + 1) return '环境偏法术节奏：中后期叠法强阵容最稳。';
  if (ad >= ap + 1 && ad >= tank + 1) return '环境偏物理节奏：暴击/攻速速攻阵容冲分首选。';
  if (tank >= ap && tank >= ad) return '环境偏坦克肉装：前排扛伤阵容成型快。';
  return '环境均衡：物理 / 法术 / 坦克三系都有人玩。';
}

export default function VersionOnePager() {
  const topItems = top3Items();
  const topComps = top3Comps();
  const env = envOneLiner(topComps);

  return (
    <section className="onepager">
      <div className="onepager-head">
        <div>
          <span className="season-tag">S18 自然之力 · 2026-09-02 速报</span>
          <h2 className="section-title" style={{ marginBottom: 4 }}>版本速报 · 一图流</h2>
        </div>
        <Link href="/changelog" className="btn-ghost">历史归档 →</Link>
      </div>

      <p className="onepager-env">{env}</p>

      <div className="onepager-grid">
        <div className="onepager-col">
          <h3>🔥 最强 3 件装</h3>
          <ul className="onepager-list">
            {topItems.map((it, i) => (
              <li key={it.id}>
                <span className="op-no">{i + 1}</span>
                <IconImg src={it.icon} alt={it.name} className="cell-ic" circle={false} />
                <span className="op-name">{it.name}</span>
                <span className="op-stat">{it.avgPlacement?.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="onepager-col">
          <h3>🏆 最强 3 套阵容</h3>
          <ul className="onepager-list">
            {topComps.map((c, i) => (
              <li key={c.compId}>
                <span className="op-no">{i + 1}</span>
                <span className="op-name">{c.name}</span>
                <span className="op-tag tag-t0">{c.tier}</span>
                <span className="op-stat">{(c.stat?.opScore || 0).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="onepager-col">
          <h3>📌 一句话版本环境</h3>
          <ul className="onepager-tips">
            <li>• 上分首选：opScore ≥ 2.0 的护卫 / 灵魂莲华 法系大核</li>
            <li>• 节奏判断：前期出血装快抢速攻；后期转 AP 法师叠法强</li>
            <li>• 装备优先级：最后轻语 / 大天使 / 光明版 各抢 1 件</li>
            <li>• 避雷：黑榜 5 件慎出（朔极 / 投机 / 无尽 / 大亨 / 黑荆棘）</li>
          </ul>
        </div>
      </div>
    </section>
  );
}