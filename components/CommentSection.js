'use client';

import { useState, useEffect } from 'react';

function fmt(iso) {
  try {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`;
  } catch {
    return '';
  }
}

export default function CommentSection({ compId }) {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comments?compId=${encodeURIComponent(compId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setList(d.comments);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [compId]);

  const submit = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setPosting(true);
    try {
      const r = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compId, name: name.trim(), text: t }),
      });
      const d = await r.json();
      if (d.ok) {
        setList((l) => [d.comment, ...l]);
        setText('');
      }
    } catch {
      /* 失败静默，用户可重试 */
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="comment-sec">
      <form className="comment-form" onSubmit={submit}>
        <div className="cf-row">
          <input
            className="cf-name"
            placeholder="昵称（可空，默认「匿名玩家」）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
          />
        </div>
        <textarea
          className="cf-text"
          rows={3}
          placeholder="聊聊这套阵容：运营心得、翻车点、克制思路、装备替换…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <div className="cf-foot">
          <span className="muted cf-count">{text.length}/500</span>
          <button className="btn btn-gold" type="submit" disabled={posting || !text.trim()}>
            {posting ? '发送中…' : '发表评论'}
          </button>
        </div>
      </form>

      <div className="comment-list">
        <div className="cl-head">全部评论（{list.length}）</div>
        {loading ? (
          <p className="muted" style={{ padding: '16px' }}>
            加载中…
          </p>
        ) : list.length ? (
          list.map((c) => (
            <div className="comment" key={c.id}>
              <div className="c-top">
                <span className="c-name">{c.name}</span>
                <span className="c-time">{fmt(c.createdAt)}</span>
              </div>
              <p className="c-text">{c.text}</p>
            </div>
          ))
        ) : (
          <div className="empty-state">还没有评论，来抢沙发，分享你的上分心得。</div>
        )}
      </div>
    </div>
  );
}
