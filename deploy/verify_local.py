import urllib.request, json, os, sys, time

BASE = "http://127.0.0.1:3000"
RESULTS = []

def get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "verify"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status, r.read().decode("utf-8", "replace")

def post(path, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(BASE + path, data=data, headers={
        "User-Agent": "verify", "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")

# 1) 首页：数据口径横幅 + 信息差上移 + 最后更新
try:
    st, html = get("/")
    checks = {
        "首页HTTP200": st == 200,
        "数据口径横幅(data-banner)": "data-banner" in html,
        "国服S18实测文案": "国服" in html and "S18" in html,
        "信息差上移(info-gap-top)": "info-gap-top" in html,
        "最后更新标注": "最后更新" in html,
    }
    RESULTS.append(("首页", checks))
except Exception as e:
    RESULTS.append(("首页", {"EXCEPTION": str(e)}))

# 2) /feedback 页面
try:
    st, html = get("/feedback")
    checks = {
        "/feedback HTTP200": st == 200,
        "反馈表单(ff-form)": "ff-form" in html or "feedback-form" in html,
        "纠错入口": "纠错" in html,
    }
    RESULTS.append(("/feedback", checks))
except Exception as e:
    RESULTS.append(("/feedback", {"EXCEPTION": str(e)}))

# 3) 阵容详情页：纠错链接 + 最后更新
try:
    st, html = get("/comp/1")
    checks = {
        "详情页HTTP200": st == 200,
        "纠错/反馈链接": "纠错" in html and "feedback" in html,
        "最后更新标注": "最后更新" in html,
    }
    RESULTS.append(("详情页/comp/1", checks))
except Exception as e:
    RESULTS.append(("详情页/comp/1", {"EXCEPTION": str(e)}))

# 4) 反馈 API 落盘
before = 0
fp = os.path.join(os.path.dirname(__file__), "..", "data", "social", "feedback.jsonl")
fp = os.path.abspath(fp)
if os.path.exists(fp):
    before = sum(1 for _ in open(fp, encoding="utf-8"))
st, body = post("/api/feedback", {
    "type": "纠错", "content": "测试反馈：某阵容站位描述有误", 
    "contact": "", "comp": "1", "name": "测试阵容", "page": "/comp/1"})
after = 0
if os.path.exists(fp):
    after = sum(1 for _ in open(fp, encoding="utf-8"))
checks = {
    "API返回200/201": st in (200, 201),
    "feedback.jsonl 已落盘": after == before + 1,
    f"行数 {before}→{after}": after == before + 1,
}
RESULTS.append(("/api/feedback POST", checks))

# 5) 长尾攻略 3 篇编译可达
for slug in ["crash-comp-transform", "level8-vs-9", "when-to-reroll"]:
    try:
        st, html = get("/guides/" + slug)
        RESULTS.append((f"/guides/{slug}", {"HTTP200": st == 200}))
    except Exception as e:
        RESULTS.append((f"/guides/{slug}", {"EXCEPTION": str(e)}))

print("=== 本地生产冒烟验证 ===")
allok = True
for name, checks in RESULTS:
    print(f"\n[{name}]")
    for k, v in checks.items():
        mark = "OK " if v is True else ("FAIL" if v is False else "?? ")
        if v is False:
            allok = False
        print(f"  {mark}{k}: {v}")
print("\n=== 总结:", "全部通过" if allok else "存在失败项", "===")
sys.exit(0 if allok else 1)
