#!/usr/bin/env bash
# 弈览 · 生产启动脚本（常驻服务器 / VPS，非 Docker 用）
# 用法：bash scripts/start-prod.sh
# 首次部署建议先手动跑一次内容刷新（需 OP.GG 可达 + 可选混元密钥）：
#   npm run sync && npm run assets && node scripts/backfill-guides.mjs
set -e

echo "▶ 安装依赖…"
npm install

echo "▶ 生产构建…"
npm run build

echo "▶ 启动生产服务（监听 \$PORT，缺省 3000）…"
exec env PORT="${PORT:-3000}" npm run start
