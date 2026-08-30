'use client';

import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: '阵容', match: (p) => p === '/' || p.startsWith('/comp') },
  { href: '/items', label: '装备', match: (p) => p.startsWith('/item') },
  { href: '/versions', label: '版本', match: (p) => p.startsWith('/version') },
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
