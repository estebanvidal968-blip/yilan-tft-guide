#!/usr/bin/env bash
# 弈览 · 服务器一键初始化 + 部署脚本
# 目标环境：腾讯云轻量应用服务器 · Ubuntu 22.04 LTS · 上海
# 用法：root 登录服务器后，把本文件传上去（或直接粘贴到网页终端）执行：
#   bash setup-server.sh
set -euo pipefail

REPO="https://github.com/estebanvidal968-blip/yilan-tft-guide.git"
APP_DIR="/opt/yilan/app"
DATA_DIR="/opt/yilan/data/social"

echo "==> [1/5] 系统更新与基础工具"
apt-get update -y && apt-get upgrade -y
apt-get install -y git curl ufw

echo "==> [2/5] 安装 Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | bash
fi
systemctl enable --now docker
docker --version

echo "==> [3/5] 拉取代码并构建镜像"
mkdir -p "$APP_DIR" "$DATA_DIR"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git pull --ff-only
else
  git clone "$REPO" "$APP_DIR" && cd "$APP_DIR"
fi
docker build -t yilan:latest .

echo "==> [4/5] 启动容器（数据卷持久化点赞/评论）"
docker rm -f yilan 2>/dev/null || true
docker run -d \
  --name yilan \
  --restart unless-stopped \
  -p 80:3000 \
  -v "$DATA_DIR":/app/data/social \
  yilan:latest

echo "==> [5/5] 防火墙放行 80/443/22"
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp
ufw --force enable

echo ""
echo "✅ 部署完成！备案前阶段：浏览器访问 http://<服务器公网IP> 验证"
echo "   备案通过后：把 deploy/Caddyfile 中域名段启用，并执行 install-caddy.sh 配 HTTPS"
