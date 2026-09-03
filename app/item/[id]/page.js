import itemsTft from '@/data/tft/items.json';
import comps from '@/data/comps.opgg.json';
import IconImg from '@/components/IconImg';

// /item/[id] 改版：全量 140 件装备详情
//   - 数据源切换：data/items.json（16 件种子） → data/tft/items.json（140 件 OP.GG 全量）
//   - 新增模块：① 强搭弈子 Top5（带增益/胜率）② 反查阵容 Top5（comps.coreItems 匹配）
//   - 新增标记：红榜（avgPlacement ≤ 3.6）/ 黑榜（≥ 4.1）徽章
//   - 保留：合成路径（从顶层 data/items.json 反查 buildFrom/recipe 兼容旧链接）

import baseItems from '@/data/items.json';
import itemDescZh from '@/data/item-desc-zh.json';
import synthPairs from '@/data/synth-pairs.json';
import { SEASON } from '@/lib/season';

// 合成表（散件 id → 成装名）与散件名/图标映射，供 FAQ「怎么合成」使用
const SYNTH_BY_TO = new Map((synthPairs || []).map((p) => [p.to, p]));
const COMP_NAME = new Map((baseItems || []).map((c) => [c.itemId, c.name || c.itemId]));
const COMP_ICON = new Map((baseItems || []).map((c) => [c.name, c.icon || null]));
const compName = (id) => COMP_NAME.get(id) || id;

// 纹章（神器）已从装备库移除，但 140 条里的 21 个纹章路由仍然保留，
// 避免阵容页 / 攻略页的旧链接 404。纹章描述用模板句自动汉化。
const ZH_EMBLEM_TEMPLATE = (traitName) =>
  `携带者获得「${traitName}」羁绊，并获得该羁绊的双倍加成。`;

// items.json 的 desc 是 OP.GG 抓取的英文原文 → 优先用人工中文翻译，缺失时回退英文。
function descOf(it) {
  if (itemDescZh[it.id]) return itemDescZh[it.id];
  if (it.kind === '纹章') {
    const trait = (it.name || '').replace(/纹章$/, '');
    if (trait) return ZH_EMBLEM_TEMPLATE(trait);
  }
  return it.desc || '';
}

export function generateStaticParams() {
  // 预渲染所有 140 件详情页
  return itemsTft.map((i) => ({ id: i.id }));
}

export function generateMetadata({ params }) {
  const it = itemsTft.find((i) => i.id === params.id);
  if (!it) return { title: '装备未找到 · 弈览' };
  // 用中文描述做摘要（descOf 定义在下方，函数声明会提升）
  const zh = descOf(it).replace(/\n+/g, ' ');
  const who = (it.best || []).slice(0, 2).map((b) => b.champName).join('、');
  const recipe = SYNTH_BY_TO.get(it.name);
  const tail = recipe
    ? `${recipe.from.map(compName).join('+')}合成`
    : who
      ? `给${who}带`
      : '';
  const base = `${it.name}：${zh}`.slice(0, 130);
  return {
    title: `${it.name} · 装备详情 · 弈览`,
    description: tail ? `${base}｜${tail}` : base,
  };
}

function tierTag(it) {
  const kind = it.kind;
  if ((it.name || '').startsWith('光明版')) return { label: '光明武器', tone: 'wild' };
  if (kind === '纹章') return { label: '神器', tone: 'gold' };
  if (kind === '成装') return { label: '成装', tone: 'plain' };
  return { label: kind || '装备', tone: 'plain' };
}

// 红黑榜判定：必须同时有样本量。OP.GG 里 36 件光明武器 sampleCount 全为 0、
// avgPlacement 为 0，若不判样本会被误判成「红榜必抢」（0 ≤ 3.6）。
function verdictTag(ap, sampleCount) {
  if (typeof ap !== 'number' || !isFinite(ap) || ap <= 0) return null;
  if (!(sampleCount > 0)) return null;
  if (ap <= 3.6) return { label: '红榜', tone: 'must' };
  if (ap >= 4.1) return { label: '黑榜', tone: 'avoid' };
  return null;
}

// 光明武器（名称「光明版X」）在 OP.GG 无独立样本，用原型装备 X 的数据作参考
function baseRefOf(it) {
  if (!(it.name || '').startsWith('光明版')) return null;
  const baseName = it.name.slice('光明版'.length);
  const base = itemsTft.find((i) => i.name === baseName && (i.sampleCount || 0) > 0);
  return base ? { name: base.name, id: base.id, avgPlacement: base.avgPlacement, sampleCount: base.sampleCount } : null;
}

function fmtN(n) {
  if (n == null) return '—';
  if (n >= 10000) return (n / 10000).toFixed(1) + ' 万';
  return String(n);
}

export default function ItemDetail({ params }) {
  const it = itemsTft.find((i) => i.id === params.id);

  // 兼容旧链接：从顶层散件种子匹配 itemId
  if (!it) {
    const legacy = baseItems.find((i) => i.itemId === params.id);
    if (legacy) {
      return (
        <div className="stack">
          <a className="back-link" href="/items">← 返回装备</a>
          <div className="detail-head">
            <h1>{legacy.name}</h1>
            <span className="tag">{legacy.tier}</span>
          </div>
          <p className="muted">
            基础散件：合成路径与反向查询见 <a href="/items">装备库</a>。
          </p>
        </div>
      );
    }
    return <p className="muted">未找到该装备（id: {params.id}）。</p>;
  }

  // 反查：用此装的阵容
  const usedBy = comps
    .filter((c) => Array.isArray(c.coreItems) && c.coreItems.includes(it.name))
    .sort((a, b) => (b.stat?.opScore || 0) - (a.stat?.opScore || 0))
    .slice(0, 5);

  // 强搭弈子
  const best = (it.best || []).slice(0, 5);

  const tag = tierTag(it);
  const hasData = (it.sampleCount || 0) > 0 && (it.avgPlacement || 0) > 0;
  const verdict = verdictTag(it.avgPlacement, it.sampleCount);
  const baseRef = baseRefOf(it);
  const desc = descOf(it);

  // ---- FAQ 长尾块：承接「S18 {name} 给谁带 / 怎么合成 / 值不值得」搜索 ----
  const recipe = SYNTH_BY_TO.get(it.name);
  const whoBest = (it.best || []).slice(0, 3);
  const faq = [
    {
      q: `S${SEASON.no} ${it.name} 给谁带？`,
      a: whoBest.length
        ? `优先给 ${whoBest
            .map((b) => `${b.champName}（增益 +${b.delta?.toFixed?.(2) ?? '?'}、平均名次 ${b.avgPlacement?.toFixed?.(2) ?? '?'}）`)
            .join('、')} 带。`
        : '暂无该装备的强搭弈子统计，可参考下方数据表现自行判断。',
    },
    {
      q: `S${SEASON.no} ${it.name} 怎么合成？`,
      a: recipe
        ? `${recipe.from.map(compName).join(' + ')} 合成 ${it.name}。`
        : it.kind === '纹章'
          ? '由金铲铲 / 金锅锅 + 对应散件合成（神器纹章）。'
          : '为基础 / 散件装备，不可由其他散件合成。',
    },
    {
      q: `S${SEASON.no} ${it.name} 值不值得做？`,
      a: verdict
        ? `${verdict.label}，平均名次 ${it.avgPlacement.toFixed(2)}，当前版本${
            verdict.tone === 'must' ? '优先级拉满，必抢' : '名次拖后，慎用'
          }。`
        : hasData
          ? `平均名次 ${it.avgPlacement.toFixed(2)}，属中性装备，按需取舍。`
          : '暂无独立对局样本，建议参考原型装备或结合阵容判断。',
    },
  ];
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="stack">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <a className="back-link" href="/items">← 返回装备库</a>

      <div className="detail-head">
        <div className="item-detail-icon">
          <IconImg src={it.icon} alt={it.name} className="cell-ic" circle={false} />
        </div>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          <h1>{it.name}</h1>
          <div className="detail-meta" style={{ marginTop: 4, marginBottom: 0 }}>
            <span className={`tag tag-${tag.tone}`}>{tag.label}</span>
            {verdict ? <span className={`tag tag-${verdict.tone}`}>{verdict.label} · 平均名次 {it.avgPlacement.toFixed(2)}</span> : null}
            {!hasData ? <span className="tag tag-plain" title="OP.GG 暂无该装备的独立对局样本">暂无样本</span> : null}
            {it.kind === '纹章' ? <span className="muted" style={{ marginLeft: 8 }}>铲子 + 基础装备合成</span> : null}
          </div>
        </div>
      </div>

      {/* 装备描述（中文，按换行分段） */}
      {desc ? (
        <div className="panel">
          <h3>装备效果</h3>
          <div className="item-desc">
            {desc.split('\n').map((line, i) => (
              <p key={i} className="guide-p item-desc-line">{line}</p>
            ))}
          </div>
        </div>
      ) : null}

      {/* 数据表现 */}
      <div className="panel">
        <h3>数据表现</h3>
        <div className="item-detail-stats">
          <div className="ids">
            <span className="ids-k">平均名次</span>
            <span className={`ids-v ${verdict ? `tone-${verdict.tone}` : ''}`}>
              {hasData ? it.avgPlacement.toFixed(2) : '—'}
            </span>
          </div>
          <div className="ids">
            <span className="ids-k">出场样本</span>
            <span className="ids-v">{(it.sampleCount || 0) > 0 ? fmtN(it.sampleCount) : '—'}</span>
          </div>
          <div className="ids">
            <span className="ids-k">类别</span>
            <span className="ids-v">{tag.label}</span>
          </div>
        </div>

        {hasData ? (
          <p className="muted" style={{ fontSize: '.82rem', marginTop: 14 }}>
            平均名次越低越强；中性基线约 3.83。
            {verdict?.tone === 'must' ? ' 当前版本优先级拉满。' : null}
            {verdict?.tone === 'avoid' ? ' 当前版本出场不低但名次拖后，慎用。' : null}
          </p>
        ) : (
          <p className="muted" style={{ fontSize: '.82rem', marginTop: 14 }}>
            OP.GG 暂未收录该装备的独立对局样本（光明武器为轮换玩法，出场量过低无法统计）。
            {baseRef ? (
              <>
                {' '}可参考其原型{' '}
                <a href={`/item/${baseRef.id}`} style={{ color: 'var(--gold)' }}>{baseRef.name}</a>
                {' '}的数据：平均名次 <b>{baseRef.avgPlacement?.toFixed(2)}</b>、样本 {fmtN(baseRef.sampleCount)}。
              </>
            ) : null}
          </p>
        )}
      </div>

      {/* 强搭 Top5 弈子 */}
      {best.length > 0 ? (
        <div className="panel">
          <h3>带这装最强的弈子 Top{best.length}</h3>
          <ul className="item-best-list">
            {best.map((b) => (
              <li key={b.champ}>
                <IconImg src={b.champIcon} alt={b.champName} className="isc-cic" circle={false} />
                <span className="ibl-name">{b.champName}</span>
                <span className="ibl-meta">
                  增益 <b>+{b.delta?.toFixed(2)}</b>
                  <span className="dim"> · 名次 {b.avgPlacement?.toFixed(2)}</span>
                  <span className="dim"> · 胜率 {(b.winRate * 100)?.toFixed(1)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* 反查阵容 */}
      {usedBy.length > 0 ? (
        <div className="panel">
          <h3>用这件装备的阵容</h3>
          <ul className="item-best-list">
            {usedBy.map((c) => (
              <li key={c.compId}>
                <span className={`tag tag-${c.tier === 'T0' ? 't0' : 't1'}`} style={{ flex: '0 0 auto' }}>{c.tier}</span>
                <a className="ibl-name" href={`/comp/${c.compId}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>{c.name}</a>
                <span className="ibl-meta">
                  强度分 <b>{c.stat?.opScore?.toFixed(2) ?? '—'}</b>
                  <span className="dim"> · {c.traits?.slice(0, 4).join(' · ')}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* FAQ 长尾块（可见）+ 内链 */}
      <div className="panel">
        <h3>大家都在搜 · {it.name}</h3>
        <div className="faq">
          {faq.map((f) => (
            <div className="faq-item" key={f.q}>
              <p className="faq-q">{f.q}</p>
              <p className="faq-a">{f.a}</p>
            </div>
          ))}
        </div>
        {recipe ? (
          <div className="faq-recipe">
            <span className="muted">合成路径：</span>
            {recipe.from.map((fid, i) => (
              <span key={fid + i} className="faq-recipe-comp">
                <IconImg src={COMP_ICON.get(compName(fid)) || null} alt={compName(fid)} fallback={(compName(fid) || '?').slice(0, 1)} className="faq-recipe-ic" />
                {compName(fid)}
              </span>
            ))}
            <span className="faq-recipe-plus">→</span>
            <span className="faq-recipe-to">{it.name}</span>
          </div>
        ) : null}
        <div className="kv" style={{ marginTop: 14 }}>
          <a className="tag tag-with-icon" href="/trait">羁绊总览</a>
          <a className="tag tag-with-icon" href="/tools/quiz">装备合成小测</a>
        </div>
      </div>
    </div>
  );
}