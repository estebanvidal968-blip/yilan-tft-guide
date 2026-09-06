#!/bin/bash
# 弈览统一发布 — scripts/deploy.sh [--target selfhosted|workbuddy|all]
#
# 设计原则（详见 docs/deploy-rule.md）：
#   - 唯一可编辑源 = lol-tft-guide（git 仓库）
#   - 部署从 git HEAD 拉（git archive），不依赖任何副本
#   - selfhosted：scp + 服务器侧脚本（docker build + 停旧起新）
#   - workbuddy：preflight 后由工具 workbuddy_sites_deploy 执行（agent 调用）
set -u
SELF="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SELF/.." && pwd)"
TARGET="${1:-all}"
SERVER_USER="${SERVER_USER:-ubuntu}"
SERVER_HOST="${SERVER_HOST:-124.223.170.208}"
SSH_KEY="${SSH_KEY:-/c/Users/admin/.ssh/id_ed25519}"
SERVER="$SERVER_USER@$SERVER_HOST"

echo "==> 弈览统一发布 ROOT=$ROOT TARGET=$TARGET SERVER=$SERVER"

bash "$SELF/preflight.sh" "$ROOT" || { echo "PREFLIGHT_FAIL"; exit 1; }

deploy_selfhosted() {
  echo ""
  echo "==> 发布到自托管 $SERVER"
  cd "$ROOT"
  TS=$(date +%Y%m%d_%H%M%S)

  # 从 git HEAD 打包（自动排除 .git，tracked-only）
  # 本地 tar 用相对路径写（git archive 在 Windows 不认 /e/... Git Bash 绝对路径），写完再取绝对路径 scp
  LOCAL_TAR_REL="yilan-src-$TS.tgz"
  REMOTE_TAR="/tmp/yilan-src-$TS.tgz"
  git archive --format=tar.gz -o "$LOCAL_TAR_REL" HEAD || { echo "ARCHIVE_FAIL"; exit 1; }
  LOCAL_TAR="$ROOT/$LOCAL_TAR_REL"
  echo "tar: $LOCAL_TAR ($(wc -c < "$LOCAL_TAR") bytes)"

  # scp tar + 服务器侧脚本
  scp -i "$SSH_KEY" -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -o ConnectTimeout=20 \
    "$LOCAL_TAR" "$SELF/deploy-selfhosted-server.sh" "$SERVER:/tmp/" \
    || { echo "SCP_FAIL"; exit 1; }

  # 服务器侧 nohup 脱离（沙箱 SSH 后台受限，坑 #6）
  ssh -i "$SSH_KEY" -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no "$SERVER" \
    "nohup bash /tmp/deploy-selfhosted-server.sh $REMOTE_TAR > /tmp/deploy-run.log 2>&1 & echo PID=\$!"

  # 轮询日志（每 15s 一次，最多 6 分钟）
  for i in $(seq 1 24); do
    sleep 15
    STATE=$(ssh -i "$SSH_KEY" -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no "$SERVER" \
      'tail -1 /tmp/deploy-run.log' 2>/dev/null)
    echo "[poll $i] $STATE"
    echo "$STATE" | grep -q "DEPLOY_DONE" && break
    echo "$STATE" | grep -qE "FAIL" && {
      echo "DEPLOY_FAIL"; ssh -i "$SSH_KEY" -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no "$SERVER" 'tail -40 /tmp/deploy-run.log'; exit 1; }
  done

  # 外部独立验证（沙箱直连公网）
  echo "==> 外部验证 http://$SERVER_HOST/guides"
  N=$(curl -s --max-time 20 "http://$SERVER_HOST/guides" | grep -o 'href="/guides/[A-Za-z0-9-]*"' | sort -u | wc -l)
  echo "外部 guides 链接去重 = $N"
  [ "$N" = "24" ] || { echo "VERIFY_FAIL expected 24 got $N"; exit 1; }
  echo "SELFHOSTED_DEPLOY_OK"
}

deploy_workbuddy() {
  echo ""
  echo "==> WorkBuddy 目标：由 agent 调 workbuddy_sites_deploy"
  echo "   directory 参数：$ROOT"
  echo "   startCmd 用：env -u NODE_OPTIONS rm -rf .next && npm run build && npm start"
  echo "WORKBUDDY_READY_FOR_AGENT"
}

case "$TARGET" in
  selfhosted) deploy_selfhosted ;;
  workbuddy)  deploy_workbuddy ;;
  all)        deploy_selfhosted; echo "---"; deploy_workbuddy ;;
  *) echo "用法: $0 [selfhosted|workbuddy|all]"; exit 1 ;;
esac