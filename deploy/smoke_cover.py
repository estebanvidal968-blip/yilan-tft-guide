import subprocess, time, urllib.request, urllib.error, json, os, sys

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NODE = r"C:\Users\admin\.workbuddy\binaries\node\versions\22.22.2\node.exe"
PORT = 3213
BASE = f"http://127.0.0.1:{PORT}"
os.environ["NO_PROXY"] = "127.0.0.1,localhost"
os.environ["no_proxy"] = "127.0.0.1,localhost"
env = os.environ.copy()
env["CODEBUDDY_SAFE_DELETE_ENABLED"] = "0"

op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
def get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "smoke-cover"})
    with op.open(req, timeout=20) as r:
        return r.status, r.read().decode("utf-8", "replace")

print(f"[cover] starting next start on {BASE} ...")
proc = subprocess.Popen([NODE, "node_modules/next/dist/bin/next", "start", "-p", str(PORT)],
    cwd=PROJECT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
ready = False
for i in range(45):
    time.sleep(1)
    try:
        st, _ = get("/")
        if st == 200:
            ready = True; print(f"[cover] ready after {i+1}s"); break
    except Exception:
        pass
if not ready:
    out = proc.stdout.read() if proc.stdout else ""
    print("[cover] NOT ready:\n", out[-2000:]); proc.terminate(); sys.exit(2)

RESULTS = []
def chk(n, d): RESULTS.append((n, d))

# ---------- 列表页封面 ----------
st, gl = get("/guides")
# 只数真实 DOM 属性：RSC payload 里还有一份 "className":"guide-cover gc-panel ..."，裸串计数会翻倍
panels = gl.count('class="guide-cover gc-panel')
kinds = {k: gl.count(k) for k in ["gc-gold", "gc-wild", "gc-blue", "gc-purple", "gc-red"]}
chk("/guides 封面", {
    "HTTP200": st == 200,
    f"24个封面块(实际{panels})": panels == 24,
    "五类主色齐全": all(v > 0 for v in kinds.values()),
    "装备图标渲染": "tft-item/" in gl,
    "符文图标渲染": "tft-augment/" in gl,
    "棋子图标渲染": "/champion/" in gl,
    "几何符号兜底": "gc-glyph" in gl,
    "关键数字区": "gc-stat-v" in gl,
})

# ---------- 详情页 hero（装备类：3 个官方装备图标） ----------
st, h = get("/guides/item-crit-system")
chk("详情页 hero · 装备", {
    "HTTP200": st == 200,
    "hero 封面": "gc-hero" in h,
    "标题在封面内": "gc-hero-title" in h,
    "仅一个 h1(不重复)": h.count("<h1") == 1,
    "3个装备图标": h.count("tft-item/") >= 3,
    "关键数字 3": "件套质变" in h,
    "钩子文案": "gc-hook" in h,
})

# ---------- 详情页（弈子类：棋子官方头像，走短名→称号别名） ----------
st, h2 = get("/guides/champ-carry-item")
chk("详情页 hero · 弈子", {
    "HTTP200": st == 200,
    "棋子官方头像": "/champion/Draven.png" in h2 or "/champion/" in h2,
    "紫主色(gc-purple)": "gc-purple" in h2,
    "及格线数字": "件算及格" in h2,
})

# ---------- 详情页（经济类：符文官方图标） ----------
st, h3 = get("/guides/eco-augment-value")
chk("详情页 hero · 经济", {
    "HTTP200": st == 200,
    "符文官方图标": "tft-augment/" in h3,
    "绿主色(gc-wild)": "gc-wild" in h3,
})

# ---------- 详情页（无图标：几何符号兜底，不出破图） ----------
st, h4 = get("/guides/high-transmute")
chk("详情页 hero · 无图标兜底", {
    "HTTP200": st == 200,
    "红主色(gc-red)": "gc-red" in h4,
    "环形几何符号": "gl-ring" in h4,
    "无 img 图标": "gc-ic" not in h4,
})

print("\n=== 攻略封面冒烟 ===")
allok = True
for n, d in RESULTS:
    print(f"\n[{n}]")
    for k, v in d.items():
        mark = "OK " if v is True else ("FAIL" if v is False else "?? ")
        if v is False: allok = False
        print(f"  {mark}{k}: {v}")
print("\n=== 总结:", "全部通过" if allok else "存在失败项", "===")
proc.terminate()
try: proc.wait(timeout=10)
except Exception: proc.kill()
sys.exit(0 if allok else 1)
