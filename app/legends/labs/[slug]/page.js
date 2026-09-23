import Link from 'next/link';
import { notFound } from 'next/navigation';
import { labs } from '@/legends/data/labs';

export function generateStaticParams() {
  return labs.map((l) => ({ slug: l.slug }));
}

export function generateMetadata({ params }) {
  const l = labs.find((x) => x.slug === params.slug);
  if (!l) return { title: '实测攻略未找到 · 海克斯典籍 · 弈览' };
  const desc = `${l.name}：${l.hook}。玩家自建阵容的机制拆解与出装推演，含暗裔神器分配、符文选择与运营节奏。`;
  return {
    title: `${l.name} · 实测台 · 弈览`,
    description: desc.slice(0, 150),
    alternates: { canonical: `https://yilangames.com/legends/labs/${l.slug}` },
    openGraph: { title: `${l.name} · 实测台 · 弈览`, description: desc.slice(0, 150) },
  };
}

export default function LabDetailPage({ params }) {
  const idx = labs.findIndex((x) => x.slug === params.slug);
  if (idx < 0) notFound();
  const l = labs[idx];

  return (
    <>
      <nav className="lg-crumb">
        <Link href="/legends">海克斯典籍</Link>
        <span>/</span>
        <Link href="/legends/labs">实测台</Link>
        <span>/</span>
        <em>{l.name}</em>
      </nav>

      <div className="lg-head">
        <h1 className="lg-title">
          {l.name}
          <span className="lg-badge s" style={{ marginLeft: 10 }}>
            实测
          </span>
        </h1>
        <p className="lg-sub">{l.hook}</p>
        <p className="lg-flavor">{l.flavor}</p>
        <div className="lg-chips">
          <span className="lg-chip">账号：{l.account}</span>
          <span className="lg-chip">模式：{l.mode}</span>
          <span className="lg-chip">等级：{l.level}</span>
          <span className="lg-chip">强度：{l.verdict}</span>
          {l.tags.map((t) => (
            <span className="lg-chip" key={t}>
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* 样本声明：先讲清楚这不是强度评测 */}
      <div className="lg-block">
        <h2>样本说明</h2>
        <div className="lg-verdict">
          <div className="lg-verdict-t">这是什么 / 这不是什么</div>
          <p>
            这是<b>机制拆解与可复现性推演</b>，<b>不是强度评测</b>。本套来自玩家自建阵容的标准匹配对局，
            样本量不足以支撑胜率或 T 级结论，因此本篇<b>不给出任何胜率数字、也不给强度排名</b>。
            想验证强度，请在排位中自行跑满 30 场以上再下结论。
          </p>
        </div>
        <p className="lg-note">{l.sample.note}</p>
      </div>

      <div className="lg-block">
        <h2>阵容组成</h2>
        <div className="lg-tags">
          {l.units.map((u) => (
            <span key={u}>{u}</span>
          ))}
        </div>
        <div className="lg-list" style={{ marginTop: 12 }}>
          <div className="lg-row">
            <span className="lg-row-t">弗雷核心</span>
            <span className="lg-row-d">{l.core.join(' · ')}</span>
          </div>
          <div className="lg-row">
            <span className="lg-row-t">外援</span>
            <span className="lg-row-d">{l.mercs.join(' · ')}</span>
          </div>
        </div>
      </div>

      <div className="lg-block">
        <h2>羁绊构成</h2>
        <div className="lg-list">
          {l.traits.map((t) => (
            <div className="lg-row" key={t.name}>
              <span className="lg-row-t">{t.name}</span>
              <span className="lg-row-d">
                {t.count}
                <span className={`lg-flag ${t.confirmed ? 'ok' : 'todo'}`}>
                  {t.confirmed ? '已确认' : '待确认'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>三件暗裔神器怎么分</h2>
        <p className="lg-note" style={{ marginBottom: 10 }}>
          暗裔没有转职纹章——一个弈子只有装备了暗裔神器才计入暗裔层数。所以这三件神器既是装备，也是羁绊。
        </p>
        <div className="lg-keys">
          {l.artifacts.map((a) => (
            <div className="lg-key order" key={a.unit + a.artifact}>
              <div className="lg-key-top">
                <span className="lg-key-type">暗裔神器</span>
                <span className="lg-key-cond">
                  {a.unit} · {a.artifact}
                </span>
              </div>
              <div className="lg-key-attr">属性：{a.stats}</div>
              <div className="lg-key-attr">效果：{a.effect}</div>
              <div className="lg-key-eff">为什么给他：{a.why}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>装备分配</h2>
        <div className="lg-list">
          {l.items.map((it) => (
            <div className="lg-row" key={it.unit}>
              <span className="lg-row-t">{it.unit}</span>
              <span className="lg-row-d">
                {it.items.join(' · ')}
                {it.role ? `　（${it.role}）` : ''}
                <span className={`lg-flag ${it.confirmed ? 'ok' : 'todo'}`}>
                  {it.confirmed ? '玩家确认' : '待补'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>强化符文</h2>
        <div className="lg-list">
          {l.runes.map((r) => (
            <div className="lg-row" key={r.name}>
              <span className="lg-row-t">{r.name}</span>
              <span className="lg-row-d">{r.why}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>机制拆解</h2>
        <div className="lg-list">
          {l.mechanics.map((m) => (
            <div className="lg-row" key={m.title}>
              <span className="lg-row-t">{m.title}</span>
              <span className="lg-row-d">{m.body}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>运营思路</h2>
        <div className="lg-list">
          {l.play.map((p, i) => (
            <div className="lg-row" key={i}>
              <span className="lg-row-t">{String(i + 1).padStart(2, '0')}</span>
              <span className="lg-row-d">{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>与公开攻略的差异</h2>
        <table className="lg-table">
          <thead>
            <tr>
              <th>维度</th>
              <th>本套实测</th>
              <th>公开攻略常见做法</th>
            </tr>
          </thead>
          <tbody>
            {l.diffs.map((d) => (
              <tr key={d.dim}>
                <th>{d.dim}</th>
                <td>{d.lab}</td>
                <td>{d.pub}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg-block">
        <h2>风险点</h2>
        <div className="lg-list">
          {l.risks.map((r, i) => (
            <div className="lg-row" key={i}>
              <span className="lg-row-t">风险 {i + 1}</span>
              <span className="lg-row-d">{r}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>待验证清单</h2>
        <p className="lg-note" style={{ marginBottom: 8 }}>
          以下条目尚未在游戏内核实。补齐后本篇会更新；在此之前请按「未验证」看待。
        </p>
        <div className="lg-list">
          {l.openQuestions.map((q, i) => (
            <div className="lg-row" key={i}>
              <span className="lg-row-t">待补 {i + 1}</span>
              <span className="lg-row-d">{q}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lg-block">
        <h2>资料出处</h2>
        <p className="lg-note">{l.source}</p>
      </div>

      <div className="lg-pager">
        <Link href="/legends/labs">← 返回实测台</Link>
        <Link href="/legends/comps" className="lg-pager-next">
          看公开攻略阵容库 →
        </Link>
      </div>
    </>
  );
}
