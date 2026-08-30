import Link from 'next/link';

export const metadata = {
  title: '隐私政策 · 弈览',
  description: '弈览金铲铲 S18 攻略站的隐私与数据说明。',
};

export default function PrivacyPage() {
  return (
    <div className="legal">
      <Link href="/" className="back-link">
        ← 返回阵容
      </Link>
      <h1>隐私政策</h1>
      <p className="legal-lead">最后更新：2026-08-30。本页说明弈览如何收集、使用与保护你的数据。</p>

      <h2>我们收集什么</h2>
      <ul>
        <li>
          <b>收藏 / 点赞状态</b>：仅存于你自己的浏览器（localStorage），不上传服务器，换设备不共享。
        </li>
        <li>
          <b>评论</b>：你提交的昵称与内容存于服务端，用于在本站公开展示与玩家交流。昵称可留空（默认「匿名玩家」）。
        </li>
        <li>
          <b>接入广告后</b>：广告联盟（如 Google AdSense）可能通过 Cookie 记录你的浏览行为以投放个性化广告。届时本页会更新，并在站点加投放同意提示。
        </li>
      </ul>

      <h2>我们不收集 / 不做什么</h2>
      <ul>
        <li>不收集账号、密码、手机号、支付信息等个人敏感信息。</li>
        <li>不向第三方出售或交换你的数据。</li>
        <li>评论内容仅用于站点展示，我们保留删除违规评论的权利。</li>
      </ul>

      <h2>你的权利</h2>
      <p>
        你可以随时清除浏览器本地的收藏 / 点赞数据（清空站点数据即可）。如需删除自己发布的评论，可联系站点管理员。
      </p>

      <h2>联系</h2>
      <p>如有隐私相关疑问，可通过站点底部渠道联系我们。</p>
    </div>
  );
}
