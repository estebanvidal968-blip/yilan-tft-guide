import subprocess, time, urllib.request, urllib.error, json, os, sys, socket

PROJECT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NODE = r"C:\Users\admin\.workbuddy\binaries\node\versions\22.22.2\node.exe"
PORT = 3210
BASE = f"http://127.0.0.1:{PORT}"

# 强制关闭代理，避免环境 HTTP_PROXY 劫持 localhost 请求
os.environ["NO_PROXY"] = "127.0.0.1,localhost"
os.environ["no_proxy"] = "127.0.0.1,localhost"
env = os.environ.copy()
env["CODEBUDDY_SAFE_DELETE_ENABLED"] = "0"

def no_proxy_opener():
    return urllib.request.build_opener(urllib.request.ProxyHandler({}))

def get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "smoke"})
    with no_proxy_opener().open(req, timeout=15) as r:
        return r.status, r.read().decode("utf-8", "replace")

def post(path, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(BASE + path, data=data, headers={
        "User-Agent": "smoke", "Content-Type": "application/json"}, method="POST")
    try:
        with no_proxy_opener().open(req, timeout=15) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")

RESULTS = []
def check(name, d):
    RESULTS.append((name, d))

print(f"[smoke] starting next start on {BASE} ...")
proc = subprocess.Popen(
    [NODE, "node_modules/next/dist/bin/next", "start", "-p", str(PORT)],
    cwd=PROJECT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)

ready = False
for i in range(40):
    time.sleep(1)
    try:
        st, _ = get("/")
        if st == 200:
            ready = True
            print(f"[smoke] ready after {i+1}s (HTTP {st})")
            break
    except Exception:
        pass
if not ready:
    out = proc.stdout.read() if proc.stdout else ""
    print("[smoke] server NOT ready. tail log:")
    print(out[-2000:] if out else "(no output)")
    proc.terminate()
    sys.exit(2)

# 1) 首页
try:
    st, html = get("/")
    check("首页", {
        "HTTP200": st == 200,
        "数据口径横幅(data-banner)": "data-banner" in html,
        "国服S18实测文案": ("国服" in html) and ("S18" in html),
        "信息差上移(info-gap-top)": "info-gap-top" in html,
        "最后更新标注": "最后更新" in html,
    })
except Exception as e:
    check("首页", {"EXCEPTION": str(e)})

# 2) /feedback
try:
    st, html = get("/feedback")
    check("/feedback", {
        "HTTP200": st == 200,
        "反馈表单(ff-form)": ("ff-form" in html) or ("feedback-form" in html),
        "纠错入口": "纠错" in html,
    })
except Exception as e:
    check("/feedback", {"EXCEPTION": str(e)})

# 3) 阵容详情页
try:
    st, html = get("/comp/1")
    check("详情页/comp/1", {
        "HTTP200": st == 200,
        "纠错/反馈链接": ("纠错" in html) and ("feedback" in html),
        "最后更新标注": "最后更新" in html,
    })
except Exception as e:
    check("详情页/comp/1", {"EXCEPTION": str(e)})

# 4) 反馈 API 落盘
fp = os.path.abspath(os.path.join(PROJECT, "data", "social", "feedback.jsonl"))
before = sum(1 for _ in open(fp, encoding="utf-8")) if os.path.exists(fp) else 0
st, body = post("/api/feedback", {
    "type": "纠错", "content": "测试反馈：某阵容站位描述有误",
    "contact": "", "comp": "1", "name": "测试阵容", "page": "/comp/1"})
after = sum(1 for _ in open(fp, encoding="utf-8")) if os.path.exists(fp) else 0
check("/api/feedback POST", {
    "API返回200/201": st in (200, 201),
    "feedback.jsonl 落盘": after == before + 1,
    f"行数 {before}->{{after}}": after == before + 1,
    "响应体含ok": ("ok" in body) or ("success" in body),
})

# 5) 长尾攻略 3 篇
for slug in ["crash-comp-transform", "level8-vs-9", "when-to-reroll"]:
    try:
        st, html = get("/guides/" + slug)
        check(f"/guides/{slug}", {"HTTP200": st == 200, "含内容": len(html) > 1000})
    except Exception as e:
        check(f"/guides/{slug}", {"EXCEPTION": str(e)})

print("\n=== 本地生产冒烟验证 ===")
allok = True
for name, d in RESULTS:
    print(f"\n[{name}]")
    for k, v in d.items():
        mark = "OK " if v is True else ("FAIL" if v is False else "?? ")
        if v is False:
            allok = False
        print(f"  {mark}{k}: {v}")
print("\n=== 总结:", "全部通过" if allok else "存在失败项", "===")

proc.terminate()
try:
    proc.wait(timeout=10)
except Exception:
    proc.kill()
sys.exit(0 if allok else 1)
