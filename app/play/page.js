import comps from '@/data/comps.opgg.json';
import PlayClient from '@/components/PlayClient';

export const metadata = {
  title: '我这局玩什么 · 弈览',
  description: 'S18 自然之力决策器：根据你的出装 / 节奏 / 风格偏好，匹配 10 套 T0 阵容中的 Top3。',
};

export default function PlayPage() {
  return (
    <div className="stack">
      <h2 className="section-title">我这局玩什么？</h2>
      <p className="section-sub">3 步选择器 · 基于 OP.GG 10 套 T0 阵容数据匹配 Top3。</p>
      <PlayClient comps={comps} />
    </div>
  );
}