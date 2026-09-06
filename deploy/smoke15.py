import subprocess, time, urllib.request, urllib.error, json, os, sys

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NODE = r"C:\Users\admin\.workbuddy\binaries\node\versions\22.22.2\node.exe"
PORT = 3212
BASE = f"http://127.0.0.1:{PORT}"
os.environ["NO_PROXY"] = "127.0.0.1,localhost"
os.environ["no_proxy"] = "127.0.0.1,localhost"
env = os.environ.copy()
env["CODEBUDDY_SAFE_DELETE_ENABLED"] = "0"

op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
def get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "smoke15"})
    with op.open(req, timeout=20) as r:
        return r.status, r.read().decode("utf-8", "replace")
def post(path, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(BASE + path, data=data, headers={
        "User-Agent": "smoke15", "Content-Type": "application/json"}, method="POST")
    try:
        with op.open(req, timeout=20) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")

print(f"[smoke15] starting next start on {BASE} ...")
proc = subprocess.Popen([NODE, "node_modules/next/dist/bin/next", "start", "-p", str(PORT)],
    cwd=PROJECT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
ready = False
for i in range(45):
    time.sleep(1)
    try:
        st, _ = get("/")
        if st == 200:
            ready = True; print(f"[smoke15] ready after {i+1}s"); break
    except Exception:
        pass
if not ready:
    out = proc.stdout.read() if proc.stdout else ""
    print("[smoke15] NOT ready:\n", out[-2000:]); proc.terminate(); sys.exit(2)

NEW15 = ["item-component-priority","eco-augment-value","lose-streak-econ","carousel-priority","global-vs-cn-traps",
         "item-crit-system","item-ap-system","item-tank-system","item-mana-system","item-artifacts",
         "champ-carry-item","champ-frontline","item-counter","trait-item-synergy","item-recipe-gamble"]
ALL24 = NEW15 + ["high-transmute","rune-comp-matrix","item-synergy","item-tierlist","s18-fairy-refresh",
                 "s18-econ-timing","crash-comp-transform","level8-vs-9","when-to-reroll"]

comps = json.load(open(os.path.join(PROJECT, "data", "comps.json"), encoding="utf-8"))
cid = comps[0]["compId"]
RESULTS = []
def chk(n, d): RESULTS.append((n, d))

# 首页
st, html = get("/")
chk("首页", {"HTTP200": st==200, "data-banner": "data-banner" in html, "国服S18": ("国服" in html and "S18" in html), "info-gap-top上移": "info-gap-top" in html, "最后更新(hero)": "最后更新" in html})

# /guides 列表：应含全部 24 篇
st, gl = get("/guides")
hits = [s for s in ALL24 if f'/guides/{s}' in gl]
chk("/guides 列表", {"HTTP200": st==200, "列出24篇(命中"+str(len(hits))+")": len(hits)==24, "文案含数量": ("24" in gl and "篇" in gl)})

# 15 篇新攻略路由
for slug in NEW15:
    st, h = get("/guides/"+slug)
    chk(f"/guides/{slug}", {"HTTP200": st==200, "含正文(>1500字节)": len(h)>1500, "标题区渲染(guide-head)": "guide-head" in h, "含h1标题": "<h1>" in h})

# /feedback 回归
st, fhtml = get("/feedback")
chk("/feedback", {"HTTP200": st==200, "SSR含feedback-form类": "feedback-form" in fhtml, "提交按钮": "提交反馈" in fhtml, "无加载fallback残留": "加载中" not in fhtml})

# 详情页 回归
st, dhtml = get("/comp/" + cid)
chk("详情页", {"HTTP200": st==200, "最后更新标注": "最后更新" in dhtml, "来源国服实测": "国服实测" in dhtml, "纠错/反馈链接": ("纠错" in dhtml and "feedback?comp=" in dhtml)})

# 反馈 API 落盘 回归
fp = os.path.join(PROJECT, "data", "social", "feedback.jsonl")
before = sum(1 for _ in open(fp, encoding="utf-8")) if os.path.exists(fp) else 0
st, body = post("/api/feedback", {"type":"建议","content":"冒烟测试：15篇攻略上线验证","contact":"","comp":cid,"name":comps[0]["name"],"page":"/guides"})
after = sum(1 for _ in open(fp, encoding="utf-8")) if os.path.exists(fp) else 0
chk("/api/feedback", {"API200/201": st in (200,201), "落盘+1": after==before+1, "响应ok": ("ok" in body or "success" in body)})

print("\n=== 15篇攻略上线冒烟 ===")
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
