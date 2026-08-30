import './globals.css';
import HexMark from '@/components/HexMark';
import SiteNav from '@/components/SiteNav';

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
            <a href="/about">关于</a>
            <a href="/privacy">隐私政策</a>
            <span className="muted">数据来源 OP.GG + 混元生成</span>
          </span>
        </footer>
      </body>
    </html>
  );
}
