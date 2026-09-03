import CompGenClient from '@/components/CompGenClient';

// 随机阵容生成器依赖客户端交互，禁用静态预渲染
export const dynamic = 'force-dynamic';

export const metadata = {
  title: '随机阵容生成器 · 弈览',
  description: 'S18 随机阵容生成器：手气抽一套版本强势阵容，或勾选已有棋子自动匹配最契合阵容，覆盖站位、C 位装备与 AI 点评。',
};

export default function CompGenPage() {
  return (
    <div className="stack">
      <h2 className="section-title">随机阵容生成器</h2>
      <p className="section-sub">
        两种玩法：<b>抽一套</b>凭手气领版本强势阵容；<b>按已有棋子匹配</b>勾选你拿到的棋子，自动推荐最契合阵容。
        数据来自 OP.GG 当前版本 T0~T2 阵容库。
      </p>
      <CompGenClient />
    </div>
  );
}
