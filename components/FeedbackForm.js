'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

const TYPES = [
  { v: '纠错', label: '纠错（阵容 / 数据有误）' },
  { v: '建议', label: '功能 / 内容建议' },
  { v: '其他', label: '其他' },
];

export default function FeedbackForm({ prefillComp = '', prefillName = '' }) {
  const [type, setType] = useState('纠错');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | ok | err
  const [msg, setMsg] = useState('');

  const comp = prefillComp || '';
  const name = prefillName || '';

  const submit = async (e) => {
    e.preventDefault();
    if (content.trim().length < 2) {
      setStatus('err');
      setMsg('请先填写反馈内容');
      return;
    }
    setStatus('sending');
    setMsg('');
    try {
      const page = typeof window !== 'undefined' ? window.location.pathname : '';
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content, contact, comp, name, page }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus('ok');
        setMsg(data.msg || '已收到，感谢反馈！');
        setContent('');
        setContact('');
      } else {
        setStatus('err');
        setMsg(data.error || '提交失败，请稍后再试');
      }
    } catch {
      setStatus('err');
      setMsg('网络异常，请稍后再试');
    }
  };

  return (
    <form className="feedback-form" onSubmit={submit}>
      {comp ? (
        <div className="ff-related">
          关联内容：<b>{name || comp}</b>
        </div>
      ) : null}

      <label className="ff-field">
        <span className="ff-label">反馈类型</span>
        <div className="ff-types">
          {TYPES.map((t) => (
            <button
              type="button"
              key={t.v}
              className={`ff-type ${type === t.v ? 'on' : ''}`}
              onClick={() => setType(t.v)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </label>

      <label className="ff-field">
        <span className="ff-label">
          反馈内容 <i className="req">*</i>
        </span>
        <textarea
          className="ff-text"
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="哪里错了 / 想加什么内容 / 任何建议…"
        />
      </label>

      <label className="ff-field">
        <span className="ff-label">联系方式（选填，不介入邮箱）</span>
        <input
          className="ff-input"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="微信 / QQ / 留空均可，仅用于必要时回执"
        />
      </label>

      <div className="ff-actions">
        <button type="submit" className="btn btn-gold" disabled={status === 'sending'}>
          {status === 'sending' ? '提交中…' : '提交反馈'}
        </button>
        {status === 'ok' && <span className="ff-ok">✓ {msg}</span>}
        {status === 'err' && <span className="ff-err">✕ {msg}</span>}
      </div>
      <p className="ff-note">提交即存于本站服务器（数据卷 data/social），不做任何邮件外发。</p>
    </form>
  );
}
