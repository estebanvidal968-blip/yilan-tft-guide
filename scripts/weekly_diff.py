#!/usr/bin/env python3
"""
弈览 · 每周真源 diff
- 对比 data/tft/{items,augments,champs}.json 与 data/.truth-snapshot/ 的上周快照
- 写出 data/weekly-diff-YYYY-MM-DD.json（added/removed/changed）
- 把当前真源复制到 snapshot 作为下周基线
- 周一 09:00 由 automation_update 触发

用法（手动）：python3 scripts/weekly_diff.py
环境变量：YILAN_ROOT（项目根，默认 cwd）
"""
import json, os, datetime, sys

ROOT = os.environ.get("YILAN_ROOT", os.getcwd())
TRUTH = os.path.join(ROOT, "data", "tft")
SNAP = os.path.join(ROOT, "data", ".truth-snapshot")
OUT_DIR = os.path.join(ROOT, "data")
FILES = ["items", "augments", "champs"]


def load(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8", errors="replace") as f:
        return json.load(f)


def key_of(item):
    return item.get("apiName") or item.get("name") or str(item)


def diff_list(old, new):
    old_map = {key_of(x): x for x in old}
    new_map = {key_of(x): x for x in new}
    added = [new_map[k] for k in new_map if k not in old_map]
    removed = [old_map[k] for k in old_map if k not in new_map]
    changed = []
    for k in new_map:
        if k in old_map:
            a = json.dumps(old_map[k], sort_keys=True, ensure_ascii=False)
            b = json.dumps(new_map[k], sort_keys=True, ensure_ascii=False)
            if a != b:
                changed.append({"key": k, "old": old_map[k], "new": new_map[k]})
    return {"added": added, "removed": removed, "changed": changed}


def main():
    os.makedirs(SNAP, exist_ok=True)
    date = datetime.date.today().isoformat()
    out = {"date": date, "files": {}}
    summary = []
    # 基线检测：所有旧 snapshot 都不存在 → 首次建档
    is_baseline = not any(os.path.exists(os.path.join(SNAP, f + ".json")) for f in FILES)
    out["is_baseline"] = is_baseline
    for f in FILES:
        cur = load(os.path.join(TRUTH, f + ".json"))
        old = load(os.path.join(SNAP, f + ".json"))
        d = diff_list(old, cur)
        out["files"][f] = d
        summary.append(f"{f} +{len(d['added'])} -{len(d['removed'])} ~{len(d['changed'])}")
    out["summary"] = " | ".join(summary)
    out_path = os.path.join(OUT_DIR, f"weekly-diff-{date}.json")
    with open(out_path, "w", encoding="utf-8") as fp:
        json.dump(out, fp, ensure_ascii=False, indent=2)
    if is_baseline:
        print(f"BASELINE_ESTABLISHED (无 prior snapshot, 已写入快照基线)")
        print(f"WROTE {out_path}")
        print(f"SUMMARY {out['summary']}")
    else:
        print(f"WROTE {out_path}")
        print(f"SUMMARY {out['summary']}")
    # 更新 snapshot 为当前真源
    for f in FILES:
        src = os.path.join(TRUTH, f + ".json")
        dst = os.path.join(SNAP, f + ".json")
        if os.path.exists(src):
            with open(src, encoding="utf-8") as r, open(dst, "w", encoding="utf-8") as w:
                w.write(r.read())
    print("SNAPSHOT_UPDATED")


if __name__ == "__main__":
    main()