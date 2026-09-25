import { notFound } from 'next/navigation';
import { LEGENDS_LIVE } from '@/lib/legendsLive';
import '@/legends/legends.css';
import LegendsNav from './LegendsNav';

export const metadata = {
  title: '海克斯典籍 · 弈览',
  description:
    '金铲铲之战「英雄联盟传奇 · 海克斯典籍」攻略：城邦秩序/科技钥匙全览、主流阵容与装备搭配。',
};

export default function LegendsLayout({ children }) {
  // 开关关闭时整板块返回 404（含所有子路由），审核通过后把 LEGENDS_LIVE 改为 true 即可。
  if (!LEGENDS_LIVE) notFound();
  return (
    <div className="lg">
      <LegendsNav />
      {children}
    </div>
  );
}
