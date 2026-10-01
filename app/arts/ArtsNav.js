'use client';

import { usePathname } from 'next/navigation';

const items = [
  { href: '/arts', label: '总览' },
  { href: '/arts/traits', label: '羁绊' },
  { href: '/arts/comps', label: '阵容' },
];

// 详情页（如 /arts/comps/xxx）也要高亮对应父级入口，所以用 startsWith 而非精确匹配
function isActive(pathname, href) {
  if (href === '/arts') return pathname === '/arts';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function ArtsNav() {
  const pathname = usePathname() || '/arts';
  return (
    <nav className="ar-nav" aria-label="画之灵板块导航">
      {items.map((i) => (
        <a key={i.href} href={i.href} aria-current={isActive(pathname, i.href) ? 'page' : undefined}>
          {i.label}
        </a>
      ))}
    </nav>
  );
}
