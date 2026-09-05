import urllib.request, json, os, sys
BASE = "http://127.0.0.1:3210"
os.environ["NO_PROXY"] = "127.0.0.1,localhost"
op = urllib.request.build_opener(urllib.request.ProxyHandler({}))

def get(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "smoke2"})
    with op.open(req, timeout=15) as r:
        return r.status, r.read().decode("utf-8", "replace")

# 取一个真实 compId
import os as _os
_proj = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
comps = json.load(open(_os.path.join(_proj, "data", "comps.json"), encoding="utf-8"))
cid = comps[0]["compId"]
print("用真实 compId:", cid)

st, html = get("/comp/" + cid)
print("详情页 HTTP:", st)
for kw in ["最后更新", "国服实测", "纠错", "feedback?comp=", "数据来源", "来源"]:
    print(f"  含 '{kw}':", kw in html)
# 截取 detail-meta 周围
import re
m = re.search(r"detail-meta.*?</div>", html, re.S)
print("detail-meta 片段:", (m.group(0)[:300] if m else "未找到"))

st2, fhtml = get("/feedback")
print("\n/feedback HTTP:", st2)
for kw in ["form", "提交", "反馈类型", "纠错", "建议", "其他", "ff-", "feedback-form", "useSearchParams", "Suspense", "加载"]:
    print(f"  含 '{kw}':", kw in fhtml)
# 找页面里是否有表单动作或提交按钮
m2 = re.search(r"<form.*?</form>", fhtml, re.S)
print("SSR 中 <form> 存在:", bool(m2))
if not m2:
    # 看 Suspense fallback 是什么
    idx = fhtml.find("反馈")
    print("'反馈' 附近片段:", fhtml[idx-80:idx+200] if idx>=0 else "无'反馈'字")
