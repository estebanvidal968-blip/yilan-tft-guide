import urllib.request, urllib.error, time, sys

BASE = "https://503c908292fe4967b57787075107a826.app.workbuddy.link"
SLUGS = [
    "high-transmute","rune-comp-matrix","item-synergy","item-tierlist","s18-fairy-refresh",
    "s18-econ-timing","crash-comp-transform","level8-vs-9","when-to-reroll",
    "item-component-priority","eco-augment-value","lose-streak-econ","carousel-priority","global-vs-cn-traps",
    "item-crit-system","item-ap-system","item-tank-system","item-mana-system","item-artifacts",
    "champ-carry-item","champ-frontline","item-counter","trait-item-synergy","item-recipe-gamble",
]

def get(p):
    try:
        with urllib.request.urlopen(BASE + p, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except Exception:
        return -1, ""

DEADLINE = time.time() + 420  # 最多等 7 分钟
round_no = 0
stable = 0
while time.time() < DEADLINE:
    round_no += 1
    ok, missing, noicon = [], [], []
    for s in SLUGS:
        st, h = get("/guides/" + s)
        if st == 200 and "gc-hero" in h and "gc-hero-title" in h:
            ok.append(s)
            if "gc-glyph" not in h and not ("tft-item/" in h or "tft-augment/" in h or "/champion/" in h):
                noicon.append(s)
        else:
            missing.append(s)
    print(f"[第{round_no}轮] 已生效 {len(ok)}/24" + (f" | 待切换: {','.join(missing[:6])}{'...' if len(missing)>6 else ''}" if missing else ""))
    sys.stdout.flush()
    if not missing:
        # 要求「连续两轮全通」才算稳定，避免随机命中某个残留旧实例就误判成功
        stable += 1
        print(f"  → 全通第 {stable}/2 次")
        sys.stdout.flush()
        if stable >= 2:
            st, gl = get("/guides")
            panels = gl.count('class="guide-cover gc-panel')
            print(f"\n=== 全站稳定生效（连续2轮，第{round_no}轮）===")
            print(f"详情页 hero 封面: {len(ok)}/24")
            print(f"列表页封面块: {panels}/24")
            if noicon:
                print(f"警告·既无官方图标也无兜底符号: {noicon}")
            else:
                print("每篇均有视觉主体（官方图标 或 几何符号兜底）")
            sys.exit(0 if (len(ok) == 24 and panels == 24 and not noicon) else 1)
    else:
        stable = 0
    time.sleep(30)

print("\n=== 超时：仍有页面未切换 ===")
print("未生效:", missing)
sys.exit(1)
