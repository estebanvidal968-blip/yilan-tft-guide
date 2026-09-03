import BuildSimClient from '@/components/BuildSimClient';

// 出装模拟器依赖客户端随机/交互，禁用静态预渲染
export const dynamic = 'force-dynamic';

export const metadata = {
  title: '出装模拟器 · 弈览',
  description: 'S18 出装模拟器：选弈子 + 3 件装备，实时匹配 OP.GG 真实对局数据，给出胜率、前四率、名次增益与「奇效/陷阱」判定，可分享成绩卡。',
};

export default function BuildSimPage() {
  return (
    <div className="stack">
      <h2 className="section-title">出装模拟器</h2>
      <p className="section-sub">
        挑一个弈子、配三件装备，立刻看这套出装在 S18 真实对局里的<b>胜率 / 前四率 / 名次增益</b>，
        并判定它是<b>版本奇效</b>还是<b>版本陷阱</b>。数据来自 OP.GG 全服统计。
      </p>
      <BuildSimClient />
    </div>
  );
}
