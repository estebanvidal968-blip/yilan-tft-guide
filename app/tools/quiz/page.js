import QuizClient from '@/components/QuizClient';

// 小测每轮随机抽题，禁用静态预渲染（否则首屏题型被 SSG 缓存成固定一题）
export const dynamic = 'force-dynamic';

export const metadata = {
  title: '装备合成速记小测 · 弈览',
  description: 'S18 多题型装备小测：合成、拆解、识装三种玩法，197+ 题池随机抽 10 题，5 分钟测出装备熟练度。',
};

export default function QuizPage() {
  return (
    <div className="stack">
      <h2 className="section-title">装备合成速记小测</h2>
      <p className="section-sub">
        三种玩法轮换 —— <b>合成</b>（散件→成装）、<b>拆解</b>（成装→散件）、<b>识装</b>（效果→装备），
        共 <b>197</b> 题池随机抽 10 题不重复 · 答对 +10 / 答错 -5。
      </p>
      <QuizClient />
    </div>
  );
}
