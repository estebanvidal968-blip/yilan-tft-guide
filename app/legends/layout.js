import '@/legends/legends.css';
import LegendsNav from './LegendsNav';

export const metadata = {
  title: '海克斯典籍 · 弈览',
  description:
    '金铲铲之战「英雄联盟传奇 · 海克斯典籍」攻略：城邦秩序/科技钥匙全览、主流阵容与装备搭配。',
};

export default function LegendsLayout({ children }) {
  return (
    <div className="lg">
      <LegendsNav />
      {children}
    </div>
  );
}
