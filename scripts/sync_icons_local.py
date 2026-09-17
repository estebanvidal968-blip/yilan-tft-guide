#!/usr/bin/env python3
# 图标自托管同步：将 ddragon 英雄图 + OP.GG 装备图下载到 public/icons/，
# 回写 data/*.json 的 icon 字段为本地路径；下载失败的保留原外链（零回退风险）。
# 用法：python3 scripts/sync_icons_local.py  (日志 -> .tmp/icon_sync.log)
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'data')
PUB = os.path.join(ROOT, 'public')
CHAMP_DIR = os.path.join(PUB, 'icons', 'champions')
ITEM_DIR = os.path.join(PUB, 'icons', 'items')
os.makedirs(CHAMP_DIR, exist_ok=True)
os.makedirs(ITEM_DIR, exist_ok=True)

DD_VER = '16.17.1'
DD_BASE = f'https://ddragon.leagueoflegends.com/cdn/{DD_VER}/img/champion/'
MIN_BYTES = 1500  # 小于此视为失败/错误体

log = []
def L(msg):
    log.append(str(msg))

def curl(url, dest):
    try:
        subprocess.run(['curl', '-s', '--max-time', '30', '-L', '-o', dest, url],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return os.path.getsize(dest) if os.path.exists(dest) else 0
    except Exception as e:
        L(f'  curl err {url}: {e}')
        return 0

def load(p):
    with open(os.path.join(DATA, p), 'r', encoding='utf-8') as f:
        return json.load(f)

def save(p, obj):
    with open(os.path.join(DATA, p), 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)

def ddkey(champ_key):
    k = champ_key or ''
    if k.startswith('DA_18_'):
        return k[len('DA_18_'):]
    # 退化：取最后一段
    return k.split('_')[-1] or k

# ---------- 1. 英雄图标 ----------
L('=== champions ===')
champs = load('tft/champs.json')
champ_local = {}      # name -> local path
champ_fail = []
for c in champs:
    name = c.get('name')
    key = c.get('key', '')
    dk = ddkey(key)
    dest = os.path.join(CHAMP_DIR, dk + '.png')
    url = c.get('icon') or (DD_BASE + dk + '.png')
    if not os.path.exists(dest) or os.path.getsize(dest) < MIN_BYTES:
        sz = curl(url, dest)
    else:
        sz = os.path.getsize(dest)
    if sz >= MIN_BYTES:
        local = f'/icons/champions/{dk}.png'
        c['icon'] = local
        champ_local[name] = local
    else:
        # 下载失败：保留原外链（若有）否则置空（走 token）
        if not c.get('icon') or c['icon'].startswith('/icons/'):
            c['icon'] = None
        champ_fail.append(name)
        L(f'  FAIL champ {name} ({dk}) url={url}')
save('tft/champs.json', champs)
L(f'  champions: {len(champ_local)} local, {len(champ_fail)} fail -> {champ_fail}')

# ---------- 2. 装备图标 (140) ----------
L('=== items (140) ===')
items = load('tft/items.json')
item_local = {}
item_fail = []
for it in items:
    url = it.get('icon')
    if not url:
        continue
    base = url.split('/')[-1]
    dest = os.path.join(ITEM_DIR, base)
    if not os.path.exists(dest) or os.path.getsize(dest) < MIN_BYTES:
        sz = curl(url, dest)
    else:
        sz = os.path.getsize(dest)
    if sz >= MIN_BYTES:
        local = f'/icons/items/{base}'
        it['icon'] = local
        item_local[it['name']] = local
    else:
        item_fail.append(it['name'])
        L(f'  FAIL item {it.get("name")} url={url}')
save('tft/items.json', items)
L(f'  items: {len(item_local)} local, {len(item_fail)} fail')

# ---------- 3. 散件/组件 (data/items.json 18) ----------
L('=== data/items.json (components) ===')
comps = load('items.json')
comp_local = {}
comp_fail = []
for it in comps:
    url = it.get('icon')
    if not url:
        comp_fail.append(it.get('name'))
        continue
    base = url.split('/')[-1]
    dest = os.path.join(ITEM_DIR, base)
    if not os.path.exists(dest) or os.path.getsize(dest) < MIN_BYTES:
        sz = curl(url, dest)
    else:
        sz = os.path.getsize(dest)
    if sz >= MIN_BYTES:
        local = f'/icons/items/{base}'
        it['icon'] = local
        comp_local[it.get('name')] = local
    else:
        comp_fail.append(it.get('name'))
save('items.json', comps)
L(f'  components: {len(comp_local)} local, {len(comp_fail)} no-icon -> {comp_fail}')

# ---------- 4. 重建 icons.json ----------
L('=== rebuild icons.json ===')
comps_data = load('comps.json')
ref_champs = set()
for c in comps_data:
    for p in (c.get('positions') or []):
        ref_champs.add(p['champ'])
    for p in (c.get('roster') or []):
        ref_champs.add(p['champ'])
    for n in (c.get('coreChampions') or []):
        ref_champs.add(n)

champion_map = dict(champ_local)  # name -> local
# 补足 comps 引用的英雄（若 champs.json 之外）
for n in sorted(ref_champs):
    if n not in champion_map:
        L(f'  comp-ref champ not in champs.json (token): {n}')

item_map = {}
item_map.update(item_local)
item_map.update(comp_local)

icons_out = {
    'ddragonVersion': DD_VER,
    'generatedAt': 'self-hosted',
    'champion': champion_map,
    'item': item_map,
}
save('icons.json', icons_out)
covered = len(ref_champs & set(champion_map.keys()))
L(f'  icons.json: champion {len(champion_map)} entries, item {len(item_map)} entries')
L(f'  comps reference {len(ref_champs)} champs, covered by local: {covered}, token: {sorted(ref_champs - set(champion_map.keys()))}')

with open(os.path.join(ROOT, '.tmp', 'icon_sync.log'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(log))
print('\n'.join(log))
print('DONE')
