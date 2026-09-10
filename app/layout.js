import './globals.css';
import HexMark from '@/components/HexMark';
import SiteNav from '@/components/SiteNav';
import ShareFab from '@/components/ShareFab';

export const metadata = {
  title: '弈览 · 金铲铲 S18 攻略',
  description: '金铲铲之战 S18「自然之力」版本同步、即查即用的阵容 / 装备 / 版本攻略。',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F4F1EA',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
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
