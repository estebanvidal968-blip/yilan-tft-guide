import Link from 'next/link';

export const metadata = {
  title: '工具箱 · 弈览',
  description: '弈览工具箱：装备合成小测、出装模拟器、随机阵容生成器，把云顶攻略变成能玩的互动。',
};

const TOOLS = [
  {
    href: '/tools/quiz',
    emoji: '📝',
    name: '装备合成小测',
    desc: '合成 / 拆解 / 识装三题型轮换，197+ 题池随机抽 10 题，5 分钟测出装备熟练度。',
  },
  {
    href: '/tools/build-sim',
    emoji: '⚔️',
    name: '出装模拟器',
    desc: '选弈子 + 3 件装备，实时匹配 OP.GG 真实对局数据，判定奇效还是陷阱，可分享成绩。',
  },
  {
    href: '/tools/comp-gen',
    emoji: '🎲',
    name: '随机阵容生成器',
    desc: '抽一套版本强势阵容，或勾选已有棋子自动匹配最契合阵容，含站位与 C 位装备。',
  },
  {
    href: '/share',
    emoji: '📣',
    name: '分享中心',
    desc: '生成整站二维码与朋友圈海报，好友用微信或相机扫码即达，无需下载 App。',
  },
];

export default function ToolsHub() {
  return (
    <div className="stack">
      <h2 className="section-title">工具箱</h2>
      <p className="section-sub">
        把云顶攻略变成能玩的互动 —— 测熟练度、试出装、抽阵容，三件套都在这里。
      </p>
      <div className="tools-grid">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="tool-card enter">
            <span className="tool-emoji">{t.emoji}</span>
            <b className="tool-name">{t.name}</b>
            <p className="tool-desc">{t.desc}</p>
            <span className="tool-go">进入 →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
