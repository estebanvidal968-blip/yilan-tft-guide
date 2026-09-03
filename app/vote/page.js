import comps from '@/data/comps.opgg.json';
import VoteClient from '@/components/VoteClient';

export const metadata = {
  title: '本周最爱阵容投票 · 弈览',
  description: 'S18 自然之力：10 套 T0 阵容本周最爱投票。',
};

export default function VotePage() {
  return (
    <div className="stack">
      <h2 className="section-title">本周最爱阵容投票</h2>
      <p className="section-sub">S18 每周一刷新 · 10 套 T0 阵容里投一票 · 周日 24:00 截止，下周一出结果。</p>
      <VoteClient comps={comps} />
    </div>
  );
}