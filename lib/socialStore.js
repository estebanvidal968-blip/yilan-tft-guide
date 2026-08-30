// 服务端社交数据存储 —— 存储层已「定型」为 SQLite（better-sqlite3）。
//
// 为什么定型为 SQLite：
//   旧实现用 data/social/*.json 读写，单进程开发期可用，但并发写会丢数据/锁死，
//   多实例（Serverless / 多副本）更无法保证一致。SQLite 是单实例 VM/Docker 部署下
//   并发安全、重启持久、可查询的业界标配，也符合「趁早定型存储层」的目标。
//
// 运行行为：
//   - 装了 better-sqlite3（部署机/本机 `npm i` 之后）→ 用 SQLite，库文件在 DATA_DIR/social/social.db。
//   - 未安装（如本机未 npm i、或离线）→ 自动降级为「原子文件存储」（DATA_DIR/social/store.json），
//     保证开发/离线也能跑；生产部署请务必 `npm i better-sqlite3` 启用真正的 DB。
//   - 首次启动若检测到旧的 data/social/likes.json、comments.json，会一次性幂等迁移进库。
//
// 对外接口保持不变（getLikeCount / adjustLike / getComments / addComment），
// 因此 app/api/like、app/api/comments 及前端组件无需任何改动。

import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), 'data');
const SOCIAL_DIR = path.join(DATA_DIR, 'social');
// 旧 JSON 存储（迁移源，仅在首次启动时读取）
const OLD_LIKES = path.join(process.cwd(), 'data', 'social', 'likes.json');
const OLD_COMMENTS = path.join(process.cwd(), 'data', 'social', 'comments.json');

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

/* ---------------- SQLite 后端（生产） ---------------- */
async function createSqliteBackend() {
  // webpackIgnore：让打包器在构建期忽略该依赖（否则会因沙箱/部署机未预装而报 module not found），
  // 运行时再由 Node 动态解析。部署机 `npm install` 装上 better-sqlite3 后即生效；
  // 若仍缺失，下方 catch 会降级为原子文件存储。
  const mod = await import(/* webpackIgnore: true */ 'better-sqlite3');
  const Database = mod.default || mod;

  fs.mkdirSync(SOCIAL_DIR, { recursive: true });
  const db = new Database(path.join(SOCIAL_DIR, 'social.db'));
  db.pragma('journal_mode = WAL');
  db.exec(
    'CREATE TABLE IF NOT EXISTS likes (' +
      'comp_id TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0);'
  );
  db.exec(
    'CREATE TABLE IF NOT EXISTS comments (' +
      'id TEXT PRIMARY KEY, comp_id TEXT NOT NULL, ' +
      'name TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL);'
  );
  db.exec('CREATE INDEX IF NOT EXISTS idx_comments_comp ON comments(comp_id, created_at);');

  seedSqlite(db);

  return {
    kind: 'sqlite',
    getLikeCount(compId) {
      const row = db.prepare('SELECT count FROM likes WHERE comp_id = ?').get(compId);
      return row ? Number(row.count) : 0;
    },
    adjustLike(compId, delta) {
      const cur = db.prepare('SELECT count FROM likes WHERE comp_id = ?').get(compId)?.count ?? 0;
      const next = Math.max(0, Number(cur) + delta);
      db.prepare(
        'INSERT INTO likes(comp_id, count) VALUES(?, ?) ' +
          'ON CONFLICT(comp_id) DO UPDATE SET count = ?'
      ).run(compId, next, next);
      return next;
    },
    getComments(compId) {
      return db
        .prepare('SELECT id, name, text, created_at FROM comments WHERE comp_id = ? ORDER BY created_at DESC')
        .all(compId);
    },
    addComment(compId, name, text) {
      const comment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: String(name || '').trim().slice(0, 24) || '匿名玩家',
        text: String(text).slice(0, 500),
        created_at: new Date().toISOString(),
      };
      db.prepare(
        'INSERT INTO comments(id, comp_id, name, text, created_at) VALUES(?, ?, ?, ?, ?)'
      ).run(comment.id, compId, comment.name, comment.text, comment.created_at);
      return comment;
    },
  };
}

function seedSqlite(db) {
  const likes = readJsonSafe(OLD_LIKES);
  if (likes && typeof likes === 'object' && db.prepare('SELECT COUNT(*) AS c FROM likes').get().c === 0) {
    const ins = db.prepare('INSERT OR IGNORE INTO likes(comp_id, count) VALUES(?, ?)');
    const tx = db.transaction(() => {
      for (const [k, v] of Object.entries(likes)) ins.run(k, Number(v) || 0);
    });
    tx();
  }
  const comments = readJsonSafe(OLD_COMMENTS);
  if (comments && typeof comments === 'object' && db.prepare('SELECT COUNT(*) AS c FROM comments').get().c === 0) {
    const ins = db.prepare(
      'INSERT OR IGNORE INTO comments(id, comp_id, name, text, created_at) VALUES(?, ?, ?, ?, ?)'
    );
    const tx = db.transaction(() => {
      for (const [compId, list] of Object.entries(comments)) {
        for (const c of Array.isArray(list) ? list : []) {
          ins.run(
            c.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            compId,
            String(c.name || '匿名玩家'),
            String(c.text || '').slice(0, 500),
            c.createdAt || new Date().toISOString()
          );
        }
      }
    });
    tx();
  }
}

/* ---------------- 原子文件后端（兜底，无依赖） ---------------- */
function createFileBackend() {
  const file = path.join(SOCIAL_DIR, 'store.json');
  fs.mkdirSync(SOCIAL_DIR, { recursive: true });
  seedFile(file);

  function readAll() {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return { likes: {}, comments: {} };
    }
  }
  // 同文件系统内 rename 是原子的：先写临时文件再替换，崩溃也不会留半截文件。
  function writeAtomic(data) {
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  }

  return {
    kind: 'file',
    getLikeCount(compId) {
      const d = readAll();
      return Number((d.likes || {})[compId] || 0);
    },
    adjustLike(compId, delta) {
      const d = readAll();
      d.likes = d.likes || {};
      d.comments = d.comments || {};
      d.likes[compId] = Math.max(0, Number(d.likes[compId] || 0) + delta);
      writeAtomic(d);
      return d.likes[compId];
    },
    getComments(compId) {
      const d = readAll();
      return Array.isArray(d.comments?.[compId]) ? d.comments[compId] : [];
    },
    addComment(compId, name, text) {
      const d = readAll();
      d.likes = d.likes || {};
      d.comments = d.comments || {};
      if (!Array.isArray(d.comments[compId])) d.comments[compId] = [];
      const comment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: String(name || '').trim().slice(0, 24) || '匿名玩家',
        text: String(text).slice(0, 500),
        created_at: new Date().toISOString(),
      };
      d.comments[compId].unshift(comment);
      if (d.comments[compId].length > 200) d.comments[compId] = d.comments[compId].slice(0, 200);
      writeAtomic(d);
      return comment;
    },
  };
}

function seedFile(file) {
  let d;
  try {
    d = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    d = null;
  }
  d = d || { likes: {}, comments: {} };
  d.likes = d.likes || {};
  d.comments = d.comments || {};
  const likes = readJsonSafe(OLD_LIKES);
  if (likes && typeof likes === 'object') {
    for (const [k, v] of Object.entries(likes)) {
      if (!(k in d.likes)) d.likes[k] = Number(v) || 0;
    }
  }
  const comments = readJsonSafe(OLD_COMMENTS);
  if (comments && typeof comments === 'object') {
    for (const [k, v] of Object.entries(comments)) {
      if (!(k in d.comments)) d.comments[k] = Array.isArray(v) ? v : [];
    }
  }
  fs.mkdirSync(SOCIAL_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(d, null, 2));
}

/* ---------------- 单例获取（带兜底） ---------------- */
const g = globalThis;
async function getBackend() {
  if (!g.__yilanSocialBackend) {
    try {
      g.__yilanSocialBackend = await createSqliteBackend();
      console.log('[socialStore] 存储后端：SQLite ->', path.join(SOCIAL_DIR, 'social.db'));
    } catch (e) {
      g.__yilanSocialBackend = createFileBackend();
      console.warn(
        '[socialStore] 未启用 better-sqlite3，降级为原子文件存储（' +
          path.join(SOCIAL_DIR, 'store.json') +
          '）。生产部署请 `npm i better-sqlite3`。原因：' +
          (e && e.message)
      );
    }
  }
  return g.__yilanSocialBackend;
}

export async function getLikeCount(compId) {
  return (await getBackend()).getLikeCount(compId);
}
export async function adjustLike(compId, delta) {
  return (await getBackend()).adjustLike(compId, delta);
}
export async function getComments(compId) {
  return (await getBackend()).getComments(compId);
}
export async function addComment(compId, name, text) {
  return (await getBackend()).addComment(compId, name, text);
}
