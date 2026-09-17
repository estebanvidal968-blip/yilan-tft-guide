// 修正 icons.json：按 comps 使用的【短名】重建 champion 映射，
// 复用已下载的 public/icons/champions/{engKey}.png，未下载的实时补下。
// item 映射按【中文名】重建（与 comps 引用一致）。
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { CHAMPION_MAP, CHAMPION_EXTRA } from '../lib/riot-names.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA = resolve(ROOT, 'data');
const CHAMP_DIR = resolve(ROOT, 'public', 'icons', 'champions');
const ITEM_DIR = resolve(ROOT, 'public', 'icons', 'items');
mkdirSync(CHAMP_DIR, { recursive: true });
mkdirSync(ITEM_DIR, { recursive: true });

const DD_VER = '16.17.1';
const DD_BASE = `https://ddragon.leagueoflegends.com/cdn/${DD_VER}/img/champion/`;
const MIN = 1500;

const load = (p) => JSON.parse(readFileSync(resolve(DATA, p), 'utf8'));
const hasCJK = (s) => /[一-鿿]/.test(s);

function curl(url, dest) {
  try {
    execFileSync('curl', ['-s', '--max-time', '30', '-L', '-o', dest, url], { stdio: 'ignore' });
    return existsSync(dest) ? statSync(dest).size : 0;
  } catch { return 0; }
}

// 短名 -> engKey（含 CHAMPION_MAP/EXTRA 未覆盖的真实英雄）
const EXTRA = { Malphite: '墨菲特', Khazix: '卡兹克' };
const revChamp = {};
for (const [k, v] of Object.entries({ ...CHAMPION_MAP, ...CHAMPION_EXTRA, ...EXTRA })) revChamp[v] = k;

const comps = load('comps.json');
const refChamps = new Set();
for (const c of comps) {
  for (const p of (c.positions || [])) refChamps.add(p.champ);
  for (const p of (c.roster || [])) refChamps.add(p.champ);
  for (const n of (c.coreChampions || [])) refChamps.add(n);
}

const champion = {};
const token = [];
for (const name of refChamps) {
  let engKey = revChamp[name];
  if (!engKey && !hasCJK(name)) engKey = name.replace(/\s+/g, '');
  if (!engKey) { token.push(name); continue; }
  const dest = resolve(CHAMP_DIR, engKey + '.png');
  if (!existsSync(dest) || statSync(dest).size < MIN) {
    const sz = curl(DD_BASE + engKey + '.png', dest);
    if (sz < MIN) { token.push(`${name}(${engKey})`); continue; }
  }
  champion[name] = `/icons/champions/${engKey}.png`;
}

// item 映射按中文名（与 comps 引用一致）
const item = {};
const items140 = load('tft/items.json');
for (const it of items140) if (it.icon && it.icon.startsWith('/icons/items/')) item[it.name] = it.icon;
const comps_items = load('items.json');
for (const it of comps_items) if (it.icon && it.icon.startsWith('/icons/items/')) item[it.name] = it.icon;

const out = { ddragonVersion: DD_VER, generatedAt: 'self-hosted-v2', champion, item };
writeFileSync(resolve(DATA, 'icons.json'), JSON.stringify(out, null, 1));

const covered = [...refChamps].filter((n) => champion[n]).length;
console.log(`champion map: ${Object.keys(champion).length} entries`);
console.log(`item map: ${Object.keys(item).length} entries`);
console.log(`comps reference ${refChamps.size} champs -> covered ${covered}, token ${refChamps.size - covered}`);
console.log('token list:', token.join('、') || '(none)');
