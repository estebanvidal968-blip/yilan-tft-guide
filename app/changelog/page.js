import VersionOnePager from '@/components/VersionOnePager';

export const metadata = {
  title: '版本归档 · 弈览',
  description: 'S18 自然之力历史每周版本速报归档。',
};

export default function ChangelogPage() {
  return (
    <div className="stack">
      <h2 className="section-title">版本归档</h2>
      <p className="section-sub">S18 每周三更新 · 历史一图速报归档 · 当前展示最新一期。</p>
      <VersionOnePager />
      <div className="empty-state" style={{ marginTop: 24 }}>
        <div className="hex-mark" aria-hidden>↻</div>
        往期每周速报正在按周补充中。当前站点为周更节奏，每周更新一次。
      </div>
    </div>
  );
}