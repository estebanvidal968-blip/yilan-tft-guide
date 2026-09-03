'use client';

import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: '阵容', match: (p) => p === '/' || p.startsWith('/comp') },
  { href: '/items', label: '装备', match: (p) => p.startsWith('/item') },
  { href: '/trait', label: '羁绊', match: (p) => p.startsWith('/trait') },
  { href: '/champions', label: '弈子', match: (p) => p.startsWith('/champion') },
  { href: '/play', label: '玩什么', match: (p) => p.startsWith('/play') },
  { href: '/tools', label: '工具', match: (p) => p.startsWith('/tools') },
  { href: '/versions', label: '版本', match: (p) => p.startsWith('/version') || p.startsWith('/changelog') },
  { href: '/guides', label: '攻略', match: (p) => p.startsWith('/guides') },
  { href: '/mine', label: '我的', match: (p) => p.startsWith('/mine') },
];

export default function SiteNav() {
  const pathname = usePathname() || '/';
  return (
    <nav className="site-nav">
      {nav.map((n) => (
        <a key={n.href} href={n.href} aria-current={n.match(pathname) ? 'page' : undefined}>
          {n.label}
        </a>
      ))}
    </nav>
  );
}
