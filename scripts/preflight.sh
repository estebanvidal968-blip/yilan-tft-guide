#!/bin/bash
# 弈览部署预检 — git 状态 / 攻略=24 / 关键文件 / 无版本页残留
# 用法：bash scripts/preflight.sh [ROOT]
set -u
ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT" || { echo "ROOT_FAIL"; exit 1; }
echo "==> 预检根: $ROOT"

# 攻略篇数（python 计数，兼容 "slug": 与 slug: 两种键格式）
N=$(python3 scripts/_count_guides.py content/guides.js 2>/dev/null \
   || python scripts/_count_guides.py content/guides.js 2>/dev/null)
if [ -z "$N" ] || [ "$N" != "24" ]; then echo "FAIL: 攻略篇数 = ${N:-?} (期望 24)"; exit 1; fi
echo "攻略篇数 OK = $N"

# 关键文件
MISSING=0
for f in Dockerfile package.json content/guides.js app/page.js app/guides/page.js 'app/guides/[slug]/page.js'; do
  [ -f "$ROOT/$f" ] || { echo "FAIL: 缺失 $f"; MISSING=1; }
done
[ $MISSING -eq 0 ] || exit 1
echo "关键文件 OK"

# .gitignore 覆盖
if grep -q "^\.next" .gitignore && grep -q "node_modules" .gitignore; then
  echo ".gitignore OK"
else
  echo "WARN: .gitignore 缺 .next/node_modules"
fi

# 无版本页残留（VersionOnePager / /versions / /changelog 应已删）
if grep -rq "VersionOnePager\|/versions\|/changelog" app/ components/ 2>/dev/null; then
  echo "FAIL: 发现版本页残留（VersionOnePager / /versions / /changelog）"; exit 1
fi
echo "无版本页残留 OK"

# git 工作区（仅警告，不阻塞）
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  echo "WARN: git 工作区有未提交改动（发布仍可继续，但建议先 commit）"
fi

echo "PREFLIGHT_OK"