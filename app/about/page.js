import Link from 'next/link';

export const metadata = {
  title: '关于弈览 · 金铲铲 S18 攻略',
  description: '弈览是什么、数据从哪来、使用须知。',
};

export default function AboutPage() {
  return (
    <div className="legal">
      <Link href="/" className="back-link">
        ← 返回阵容
      </Link>
      <h1>关于弈览</h1>
      <p className="legal-lead">
        弈览是一个金铲铲之战 <b>S18「自然之力」</b> 版本的即查即用攻略站：阵容、装备、版本节奏、玩家评论一站搞定。
      </p>

      <h2>数据从哪来</h2>
      <ul>
        <li>阵容 / 棋子 / 装备数据来自 <b>OP.GG</b> 公开接口。</li>
        <li>「阵容选取 · 符文搭配」「选奕子小技巧」「AI 点评」由 <b>混元大模型</b> 基于阵容数据生成。</li>
      </ul>

      <h2>使用须知</h2>
      <ul>
        <li>
          当前阵容数据对应<b>全球 TFT Set18</b>，与国服金铲铲同期版本内容高度重合，但平衡数值<b>非 100% 等同国服</b>，仅供参考。
        </li>
        <li>本站为非官方爱好者站点，与腾讯 / 拳头无隶属关系。</li>
        <li>版本更新后攻略可能滞后，以游戏内实际为准。</li>
      </ul>

      <h2>交流</h2>
      <p>每套阵容详情页底部可<b>点赞、收藏、发表评论</b>，欢迎分享你的上分心得。</p>
    </div>
  );
}
