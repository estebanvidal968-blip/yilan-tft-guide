#!/usr/bin/env bash
# 弈览 · 安装并配置 Caddy（备案通过后执行）
# 前置：deploy/Caddyfile 已切换到域名段（:80 段删除、域名段启用）
set -euo pipefail

echo "==> 安装 Caddy"
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
apt-get update -y && apt-get install -y caddy

echo "==> 写入 Caddyfile"
cp "$(dirname "$0")/Caddyfile" /etc/caddy/Caddyfile

echo "==> 启动并设开机自启"
systemctl enable --now caddy
systemctl reload caddy || systemctl restart caddy

echo "✅ Caddy 就绪。验证："
echo "   curl -I https://yilangames.com   （应返回 200，证书自动签发）"
