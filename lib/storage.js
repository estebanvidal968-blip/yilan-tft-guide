// 浏览器本地存储：收藏 + 实战复盘 + 点赞本地态（MVP 不跨设备）
const FAV_KEY = 'yilan:fav';
const REC_KEY = 'yilan:records';
const LIKE_KEY = 'yilan:likes';

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function write(key, val) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(val));
}

export function getFavs() {
  return read(FAV_KEY, { comps: [], items: [] });
}

export function isFav(type, id) {
  const f = getFavs();
  return Array.isArray(f[type]) && f[type].includes(id);
}

export function toggleFav(type, id) {
  const f = getFavs();
  if (!Array.isArray(f[type])) f[type] = [];
  const i = f[type].indexOf(id);
  if (i >= 0) f[type].splice(i, 1);
  else f[type].push(id);
  write(FAV_KEY, f);
  return f[type].includes(id);
}

export function getRecords() {
  return read(REC_KEY, []);
}

export function addRecord(rec) {
  const list = getRecords();
  list.unshift({ ...rec, createdAt: new Date().toISOString() });
  write(REC_KEY, list);
  return list;
}

export function removeRecord(idx) {
  const list = getRecords();
  list.splice(idx, 1);
  write(REC_KEY, list);
  return list;
}

/* ---------------- 点赞（本地仅记「我是否赞过」，全局计数在后端） ---------------- */
export function getLikes() {
  return read(LIKE_KEY, []);
}

export function isLiked(id) {
  const l = getLikes();
  return Array.isArray(l) && l.includes(id);
}

export function toggleLike(id) {
  const l = getLikes();
  const i = l.indexOf(id);
  if (i >= 0) l.splice(i, 1);
  else l.push(id);
  write(LIKE_KEY, l);
  return l.includes(id);
}
