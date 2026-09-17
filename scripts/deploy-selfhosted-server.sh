#!/bin/bash
# 弈览自托管服务器侧部署脚本（由 deploy.sh 通过 scp + ssh 触发）
# 用法（服务器侧）：bash deploy-selfhosted-server.sh /tmp/yilan-src-XXX.tgz
#
# 流程：备份 → 清空 → 解压 → docker build（npmmirror）→ 停旧起新（:80）→ 验证
# 关键踩坑：startCmd 已固化在 Dockerfile（npx next start -H 0.0.0.0 -p ${PORT:-3000}）；
#           本脚本不重启 safe-delete 拦截（沙箱侧需 env -u NODE_OPTIONS，本机不受影响）。
set -u
TS=$(date +%Y%m%d_%H%M%S)
APP=/opt/yilan/app
BAK=/opt/yilan/app.bak.$TS
TAR="${1:-/tmp/yilan-src.tgz}"
step(){ echo ""; echo "===== [STEP] $1 ====="; }

step "1/7 备份当前 app -> $BAK"
[ -d "$BAK" ] && { echo "旧备份覆盖，先删"; sudo rm -rf "$BAK"; }
sudo cp -a "$APP" "$BAK" && echo BACKUP_OK || { echo BACKUP_FAIL; exit 1; }

step "2/7 清空 app（保留外部卷 /opt/yilan/data）"
sudo find "$APP" -mindepth 1 -maxdepth 1 -exec rm -rf {} + && echo CLEAN_OK || { echo CLEAN_FAIL; exit 1; }

step "3/7 解压源码（来自 git HEAD 的 tar）"
sudo tar -xzf "$TAR" -C "$APP" && echo EXTRACT_OK || { echo EXTRACT_FAIL; exit 1; }
sudo chown -R ubuntu:ubuntu "$APP"
echo "guides.js 含 slug 行数:"
sudo grep -c "slug" "$APP/content/guides.js" || true

step "4/7 docker build（npmmirror，约 2-4 分钟）"
cd "$APP"

# 百度统计 ID：站点为静态预渲染，必须走 build-arg 才能在 next build 时内联
ENV_FILE=/opt/yilan/env.list
TONGJI_ARG=""
if [ -f "$ENV_FILE" ] && grep -Eq '^NEXT_PUBLIC_BAIDU_TONGJI_ID=.+' "$ENV_FILE"; then
  TONGJI_VAL=$(grep -E '^NEXT_PUBLIC_BAIDU_TONGJI_ID=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '[:space:]')
  TONGJI_ARG="--build-arg NEXT_PUBLIC_BAIDU_TONGJI_ID=$TONGJI_VAL"
  echo "检测到百度统计配置，将注入构建（值不打印）"
fi

sudo docker build -t yilan:latest $TONGJI_ARG . > /tmp/docker-build.log 2>&1
if [ $? -ne 0 ]; then echo BUILD_FAIL; tail -40 /tmp/docker-build.log; exit 1; fi
tail -5 /tmp/docker-build.log
echo BUILD_OK

step "5/7 停旧容器 + 起新容器"
# 端口说明（2026-09-17 修正）：Caddy 已接管 80/443，容器必须监听 127.0.0.1:3000，
# 绝不能写成 -p 80:3000，否则会抢占 Caddy 端口导致全站不可访问（历史漂移坑）。
sudo docker stop yilan 2>/dev/null || true
sudo docker rm yilan 2>/dev/null || true

# 运行时环境变量（备用：主要用于非静态/服务端逻辑，如未来接入服务端配置）
# 约定存放在服务器 /opt/yilan/env.list（每行 KEY=VALUE），不存在则忽略
ENV_FILE=/opt/yilan/env.list
ENV_ARGS=""
if [ -f "$ENV_FILE" ]; then
  ENV_ARGS="--env-file $ENV_FILE"
  echo "加载环境变量文件：$ENV_FILE"
  sudo sed 's/=.*/=***/' "$ENV_FILE"   # 只打印键名，不泄露值
fi

sudo docker run -d --name yilan --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -v /opt/yilan/data/social:/app/data/social \
  $ENV_ARGS \
  yilan:latest && echo RUN_OK || { echo RUN_FAIL; exit 1; }

step "6/7 等待启动"
sleep 10
sudo docker ps --filter name=yilan --format '{{.Names}} | {{.Status}} | {{.Ports}}'
sudo docker logs yilan 2>&1 | tail -8

step "7/7 验证 /guides"
# 端口随上面 step 5 改为 127.0.0.1:3000
CODE=$(curl -s -o /tmp/g.html -w "%{http_code}" --max-time 20 http://127.0.0.1:3000/guides)
echo "HTTP=$CODE"
N=$(grep -o 'href="/guides/[A-Za-z0-9-]*"' /tmp/g.html | sort -u | wc -l)
echo "guides 链接去重 = $N"
# 阈值取 >=20：攻略库会随版本持续增补，写死具体数字会造成无意义的 VERIFY_FAIL
if [ "$CODE" != "200" ] || [ "$N" -lt 20 ]; then
  echo "VERIFY_FAIL（请核对攻略篇数是否意外丢失）"
  exit 1
fi
echo "DEPLOY_DONE"