'use client';

import { usePathname } from 'next/navigation';

const items = [
  { href: '/legends', label: '总览' },
  { href: '/legends/keys', label: '城邦钥匙' },
  { href: '/legends/comps', label: '阵容' },
  { href: '/legends/runes', label: '符文' },
  { href: '/legends/items', label: '装备' },
];

// 详情页（如 /legends/comps/xxx）也要高亮对应父级入口，所以用 startsWith 而非精确匹配
function isActive(pathname, href) {
  if (href === '/legends') return pathname === '/legends';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function LegendsNav() {
  const pathname = usePathname() || '/legends';
  return (
    <nav className="lg-nav" aria-label="海克斯典籍板块导航">
      {items.map((i) => (
        <a key={i.href} href={i.href} aria-current={isActive(pathname, i.href) ? 'page' : undefined}>
          {i.label}
        </a>
      ))}
    </nav>
  );
}
