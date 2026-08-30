// 服务端社交数据存储（MVP：JSON 文件，部署到持久化环境即可跨用户共享）
// 文件位置：<project>/data/social/{likes,comments}.json
import { promises as fs } from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'data', 'social');
const LIKES = path.join(DIR, 'likes.json'); // { [compId]: number }
const COMMENTS = path.join(DIR, 'comments.json'); // { [compId]: [{ id, name, text, createdAt }] }

async function readJson(file, fallback) {
  try {
    const s = await fs.readFile(file, 'utf8');
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

async function writeJson(file, val) {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(val, null, 2), 'utf8');
}

/* ---------------- 点赞 ---------------- */
export async function getLikeCount(compId) {
  const all = await readJson(LIKES, {});
  return Number(all[compId] || 0);
}

export async function adjustLike(compId, delta) {
  const all = await readJson(LIKES, {});
  const next = Math.max(0, Number(all[compId] || 0) + delta);
  all[compId] = next;
  await writeJson(LIKES, all);
  return next;
}

/* ---------------- 评论 ---------------- */
export async function getComments(compId) {
  const all = await readJson(COMMENTS, {});
  return Array.isArray(all[compId]) ? all[compId] : [];
}

export async function addComment(compId, name, text) {
  const all = await readJson(COMMENTS, {});
  if (!Array.isArray(all[compId])) all[compId] = [];
  const comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: (name || '').trim().slice(0, 24) || '匿名玩家',
    text: text.slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  all[compId].unshift(comment);
  if (all[compId].length > 200) all[compId] = all[compId].slice(0, 200);
  await writeJson(COMMENTS, all);
  return comment;
}
