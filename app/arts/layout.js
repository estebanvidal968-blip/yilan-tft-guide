import { notFound } from 'next/navigation';
import { ARTS_LIVE } from '@/lib/artsLive';
import '@/arts/arts.css';
import ArtsNav from './ArtsNav';

export const metadata = {
  title: '画之灵 · 弈览',
  description:
    '金铲铲之战「画之灵」赛季攻略：绘境机制、狂风奇遇、羁绊全览与阵容推荐。国风赛季限时返场玩法解析。',
};

export default function ArtsLayout({ children }) {
  // 开关关闭时整板块返回 404（含所有子路由），审核通过后把 ARTS_LIVE 改为 true 即可。
  if (!ARTS_LIVE) notFound();
  return (
    <div className="ar">
      <ArtsNav />
      {children}
    </div>
  );
}
