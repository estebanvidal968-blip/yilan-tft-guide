'use client';

import { useState, useEffect } from 'react';
import { getFavs, getRecords, addRecord, removeRecord, getLikes } from '@/lib/storage';
import HexMark from '@/components/HexMark';

export default function MineClient({ comps, items }) {
  const [favs, setFavs] = useState({ comps: [], items: [] });
  const [records, setRecords] = useState([]);
  const [likes, setLikes] = useState([]);
  const [form, setForm] = useState({ compId: '', rank: '1', note: '' });

  useEffect(() => {
    setFavs(getFavs());
    setRecords(getRecords());
    setLikes(getLikes());
  }, []);

  const compById = Object.fromEntries(comps.map((c) => [c.compId, c]));
  const itemById = Object.fromEntries(items.map((i) => [i.itemId, i]));

  const submit = (e) => {
    e.preventDefault();
    if (!form.compId) return;
    setRecords(addRecord({ compId: form.compId, rank: Number(form.rank), note: form.note }));
    setForm({ compId: '', rank: '1', note: '' });
  };

  return (
    <div className="stack">
      <h2 className="section-title">我的</h2>

      <div className="panel">
        <h3>收藏阵容（{favs.comps.length}）</h3>
        {favs.comps.length ? (
          <div className="kv">
            {favs.comps.map((id) =>
              compById[id] ? (
                <a key={id} className="tag" href={`/comp/${id}`}>
                  {compById[id].name}
                </a>
              ) : null
            )}
          </div>
        ) : (
          <p className="muted">还没有收藏，去阵容页点「收藏」。</p>
        )}
      </div>

      <div className="panel">
        <h3>收藏装备（{favs.items.length}）</h3>
        {favs.items.length ? (
          <div className="kv">
            {favs.items.map((id) =>
              itemById[id] ? (
                <a key={id} className="tag" href={`/item/${id}`}>
                  {itemById[id].name}
                </a>
              ) : null
            )}
          </div>
        ) : (
          <p className="muted">还没有收藏装备。</p>
        )}
      </div>

      <div className="panel">
        <h3>我赞过的阵容（{likes.length}）</h3>
        {likes.length ? (
          <div className="kv">
            {likes.map((id) =>
              compById[id] ? (
                <a key={id} className="tag" href={`/comp/${id}`}>
                  {compById[id].name}
                </a>
              ) : null
            )}
          </div>
        ) : (
          <p className="muted">还没点赞。去阵容页给心仪的套路点个♥。</p>
        )}
      </div>

      <div className="panel">
        <h3>记一局实战</h3>
        <form onSubmit={submit} className="stack" style={{ maxWidth: 420 }}>
          <div className="field">
            <label>阵容</label>
            <select
              value={form.compId}
              onChange={(e) => setForm({ ...form, compId: e.target.value })}
            >
              <option value="">选择阵容</option>
              {comps.map((c) => (
                <option key={c.compId} value={c.compId}>
                  {c.name}（{c.tier}）
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>最终排名</label>
            <select
              value={form.rank}
              onChange={(e) => setForm({ ...form, rank: e.target.value })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((r) => (
                <option key={r} value={r}>
                  第 {r} 名
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>备注</label>
            <textarea
              rows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="关键节点、反思…"
            />
          </div>
          <button className="btn btn-gold" type="submit">
            记录
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>实战复盘（{records.length}）</h3>
        {records.length ? (
          <div className="record-list">
            {records.map((r, idx) => (
              <div
                className="record-row"
                key={idx}
                style={{ animationDelay: `${Math.min(idx, 10) * 50}ms` }}
              >
                <div>
                  <span className="record-rank">{r.rank}</span>
                  <span style={{ marginLeft: 10 }}>
                    {compById[r.compId]?.name || r.compId}
                  </span>
                  {r.note && (
                    <div className="muted" style={{ fontSize: '.82rem' }}>
                      {r.note}
                    </div>
                  )}
                </div>
                <button
                  className="btn"
                  style={{ padding: '4px 10px', fontSize: '.82rem' }}
                  onClick={() => setRecords(removeRecord(idx))}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <HexMark size={40} />
            还没有记录。记录一局，看看你用某套阵容平均第几名。
          </div>
        )}
      </div>
    </div>
  );
}
