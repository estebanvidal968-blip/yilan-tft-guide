import './globals.css';
import HexMark from '@/components/HexMark';
import SiteNav from '@/components/SiteNav';
import ShareFab from '@/components/ShareFab';

export const metadata = {
  metadataBase: new URL('https://yilangames.com'),
  title: '弈览 · 金铲铲 S18 攻略',
  description: '金铲铲之战 S18「自然之力」版本同步、即查即用的阵容 / 装备 / 版本攻略。',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: '弈览',
    title: '弈览 · 金铲铲 S18 攻略',
    description: '金铲铲之战 S18「自然之力」版本同步、即查即用的阵容 / 装备 / 版本攻略。',
    url: 'https://yilangames.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: '弈览 · 金铲铲 S18 攻略',
    description: '金铲铲之战 S18「自然之力」版本同步、即查即用的阵容 / 装备 / 版本攻略。',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F4F1EA',
};

// 百度统计站点 ID：经构建期 ARG 注入（站点为静态预渲染，运行时 env 无效）
// 获取：百度统计控制台 → 站点列表 → 代码获取 → 取 hm.js? 后的 32 位 hash
// 未配置时自动跳过渲染，不阻塞页面
// 安全：强制校验 32 位十六进制，杜绝环境变量污染导致脚本注入
const RAW_TONGJI_ID = (process.env.NEXT_PUBLIC_BAIDU_TONGJI_ID || '').trim();
const TONGJI_ID = /^[0-9a-fA-F]{32}$/.test(RAW_TONGJI_ID) ? RAW_TONGJI_ID : '';

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 百度站点验证（勿删，删除会导致验证失效、影响收录） */}
        <meta name="baidu-site-verification" content="codeva-fba6mrp8Lr" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* 百度统计：仅在配置了 BAIDU_TONGJI_ID 时注入，2026-09-17 */}
        {TONGJI_ID ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `var _hmt=_hmt||[];(function(){var hm=document.createElement("script");hm.src="https://hm.baidu.com/hm.js?${TONGJI_ID}";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(hm,s);})();`,
            }}
          />
        ) : null}
      </head>
      <body>
        <header className="site-header">
          <a className="brand" href="/">
            <HexMark size={26} />
            <span className="brand-name">弈览</span>
          </a>
          <SiteNav />
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          <span>弈览 · 金铲铲 S18 自然之力攻略</span>
          <span className="footer-links">
            <a href="/share">分享给朋友</a>
            <a href="/feedback">纠错 / 反馈</a>
            <a href="/about">关于</a>
            <a href="/privacy">隐私政策</a>
            <a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer noopener">苏ICP备2026066445号-1</a>
            <span className="muted">数据源：金铲铲国服 S18 实测（非全球服 OP.GG）</span>
          </span>
        </footer>
        <ShareFab />
      </body>
    </html>
  );
}
