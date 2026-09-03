import ShareCard from '@/components/ShareCard';
import CopyLine from '@/components/CopyLine';

export const metadata = {
  title: '分享中心 · 弈览',
  description:
    '把弈览分享给一起玩金铲铲的朋友：生成整站二维码与朋友圈海报，好友用微信或相机扫码即达，无需下载 App。',
};

const PITCHES = [
  {
    label: '发游戏房间 / 队友聊天',
    text: '查阵容装备用「弈览」，网页秒开不用下 App：{URL}',
  },
  {
    label: '发微信群',
    text: '【弈览】金铲铲 S18 攻略站：阵容 / 装备合成 / 羁绊 / 弈子出装一站查，还有出装模拟器和阵容生成器，点开就能用 —— {URL}',
  },
  {
    label: '发朋友圈（配海报图）',
    text: 'S18 打上钻石靠这个：弈览攻略站，扫码直接查阵容和装备 👉 {URL}',
  },
];

const STEPS = [
  {
    n: '1',
    t: '手机打开本页',
    d: '下面这枚二维码指向弈览首页，任意一页右下角也有「分享」浮标，可生成当前页的二维码。',
  },
  {
    n: '2',
    t: '存二维码或生成海报',
    d: '点「生成朋友圈海报」得到一张竖版图，长按保存到相册。海报本身就带二维码和站名，一张图讲清楚。',
  },
  {
    n: '3',
    t: '发出去',
    d: '朋友圈 / 群 / 私聊发图片，微信里图片不会被折叠或提示风险，比直接发链接更稳。',
  },
  {
    n: '4',
    t: '好友扫码即达',
    d: '微信扫一扫、系统相机、任意浏览器扫码都能直接打开，不用装 App、不用注册。',
  },
];

export default function SharePage() {
  return (
    <div className="stack">
      <h2 className="section-title">分享中心</h2>
      <p className="section-sub">
        弈览是<b>纯网页</b>，扫码即用、无需下载。把二维码或海报发出去，就是最低成本的传播 —— 朋友扫一下就在同一页。
      </p>

      <ShareCard
        scope="site"
        headline="一起玩金铲铲 S18"
        lines={['阵容 / 装备 / 羁绊 / 弈子 即查即用', '出装模拟器 · 阵容生成器 · 装备小测']}
      />

      <section className="share-block">
        <h3 className="share-block-title">四步传出去</h3>
        <div className="share-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="share-step">
              <span className="share-step-n">{s.n}</span>
              <div>
                <b>{s.t}</b>
                <p>{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="share-block">
        <h3 className="share-block-title">现成文案，复制就发</h3>
        <p className="share-block-sub">
          游戏内聊天框不能点链接，但可以口播域名或让队友扫你发在群里的二维码；下面三条按场景选一条。
        </p>
        <div className="copy-lines">
          {PITCHES.map((p) => (
            <CopyLine key={p.label} label={p.label} text={p.text} />
          ))}
        </div>
      </section>
    </div>
  );
}
