import Link from 'next/link';
import { labs } from '@/legends/data/labs';

export const metadata = {
  title: '实测台 · 海克斯典籍 · 弈览',
  description:
    '弈览实测台：玩家自建阵容的机制拆解与出装推演。首篇为弗雷尔卓德三神器暗裔——不靠人口靠三件暗裔神器凑羁绊，含神器分配、符文选择与运营节奏。',
};

export default function LegendsLabsPage() {
  return (
    <>
      <div className="lg-head">
        <h1 className="lg-title">实测台</h1>
        <p className="lg-sub">
          这里放的是<b>玩家自建阵容的机制拆解</b>，和「阵容」页的公开攻略整理是两回事。
          公开攻略告诉你别人怎么打；实测台回答的问题是——<b>这套为什么成立、它和公开攻略差在哪</b>。
        </p>
        <div className="lg-meta">
          <span>共 {labs.length} 篇</span>
          <span>不写胜率 · 不排 T 级</span>
          <span>每条装备均标注是否已确认</span>
        </div>
      </div>

      <div className="lg-verdict">
        <div className="lg-verdict-t">关于「实测」这两个字</div>
        <p>
          实测台<b>不产出强度榜单</b>。单账号、小样本的对局数据无法支撑胜率结论（样本量低于 30 场基本没有统计意义），
          所以这里只做两件事：把一套阵容的<b>机制逻辑拆开</b>，以及把它和<b>公开攻略的差异讲清楚</b>。
          强度请以游戏内实际体验为准，本篇不提供任何胜率数字。
        </p>
      </div>

      <div className="lg-group" style={{ marginTop: 26 }}>
        <div className="lg-grid">
          {labs.map((l) => (
            <article className="lg-card lg-card-link" key={l.slug}>
              <h3>
                <Link href={`/legends/labs/${l.slug}`}>{l.name}</Link>
                <span className="lg-badge s">实测</span>
              </h3>
              <p className="lg-hook">{l.hook}</p>
              <div className="lg-chips">
                <span className="lg-chip">{l.city}</span>
                <span className="lg-chip">{l.mode}</span>
                <span className="lg-chip">强度：{l.verdict}</span>
              </div>
              <div className="lg-tags" style={{ marginTop: 10 }}>
                {l.tags.map((t) => (
                  <span key={t}>#{t}</span>
                ))}
              </div>
              <div className="lg-card-key">
                <span className="lg-card-key-t">来源</span>
                <span>{l.account}</span>
              </div>
              <Link className="lg-more" href={`/legends/labs/${l.slug}`}>
                看机制拆解 · 神器分配 · 运营 →
              </Link>
            </article>
          ))}
        </div>
      </div>

      <p className="lg-note">
        想给实测台投稿自己的阵容？把你的人物、装备、符文打出来发给我们就行，
        弈览会做机制拆解后署你的游戏 ID 上线。强度结论一律标「待验证」，不会用你的对局数据生成胜率榜单。
      </p>
    </>
  );
}
