'use client';

import { usePathname } from 'next/navigation';

const items = [
  { href: '/legends', label: '总览' },
  { href: '/legends/keys', label: '城邦钥匙' },
  { href: '/legends/comps', label: '阵容' },
  { href: '/legends/items', label: '装备' },
];

export default function LegendsNav() {
  const pathname = usePathname() || '/legends';
  return (
    <nav className="lg-nav" aria-label="海克斯典籍板块导航">
      {items.map((i) => (
        <a key={i.href} href={i.href} aria-current={pathname === i.href ? 'page' : undefined}>
          {i.label}
        </a>
      ))}
    </nav>
  );
}
