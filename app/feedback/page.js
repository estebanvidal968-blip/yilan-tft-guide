import FeedbackForm from '@/components/FeedbackForm';

export const metadata = {
  title: '纠错 / 反馈 · 弈览',
  description: '发现阵容数据有误或想提建议？通过表单直接告诉我们，无需邮箱。',
};

export default function FeedbackPage({ searchParams }) {
  const comp = (searchParams && searchParams.comp) || '';
  const name = (searchParams && searchParams.name) || '';
  return (
    <div className="stack feedback-page">
      <a className="back-link" href="/">← 返回首页</a>
      <header className="feedback-head">
        <h1 className="section-title">纠错 / 反馈</h1>
        <p className="section-sub">
          发现阵容数据、站位、装备有错，或想让我们写某个主题？直接填表单告诉我们。无需登录、不介入邮箱，提交即进入本站处理队列。
        </p>
      </header>
      <FeedbackForm prefillComp={comp} prefillName={name} />
    </div>
  );
}
