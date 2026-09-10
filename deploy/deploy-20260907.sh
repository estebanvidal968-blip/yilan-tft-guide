#!/bin/bash
# 弈览部署脚本 2026-09-07 — 目标：把当前 HEAD（28 篇攻略 + no-store 修复）上线
# 用法（在服务器侧执行）：bash /tmp/deploy-20260907.sh
set -u
TS=$(date +%Y%m%d_%H%M)
APP=/opt/yilan/app
BAK=/opt/yilan/app.bak.$TS
TAR=/tmp/yilan-src.tgz

step(){ echo ""; echo "===== [STEP] $1 ====="; }

step "0/9 前置检查"
[ -f "$TAR" ] || { echo "TAR_MISSING $TAR"; exit 1; }
echo "tar size: $(stat -c%s "$TAR" 2>/dev/null || sudo stat -c%s "$TAR") bytes"
echo "tar sha256:"; sudo sha256sum "$TAR"

step "1/9 备份当前 app -> $BAK"
if [ -d "$BAK" ]; then sudo rm -rf "$BAK"; fi
sudo cp -a "$APP" "$BAK" && echo "BACKUP_OK" || { echo "BACKUP_FAIL"; exit 1; }

step "2/9 清空 app（数据卷 /opt/yilan/data 在外，不受影响）"
sudo find "$APP" -mindepth 1 -maxdepth 1 -exec rm -rf {} + && echo "CLEAN_OK" || { echo "CLEAN_FAIL"; exit 1; }

step "3/9 解压新源码"
sudo tar -xzf "$TAR" -C "$APP" && echo "EXTRACT_OK" || { echo "EXTRACT_FAIL"; exit 1; }
sudo chown -R ubuntu:ubuntu "$APP"

step "4/9 关键文件抽查"
[ ! -f "$APP/components/VersionOnePager.js" ] && echo "OK: VersionOnePager 已删" || { echo "FAIL: VersionOnePager 仍在"; exit 1; }
[ ! -d "$APP/app/versions" ] && echo "OK: app/versions 已删" || { echo "FAIL: app/versions 仍在"; exit 1; }
if grep -q "VersionOnePager" "$APP/app/page.js"; then echo "FAIL: page.js 引用 VersionOnePager"; exit 1; else echo "OK: page.js 无 VersionOnePager"; fi
if grep -q "loadVersions" "$APP/app/page.js"; then echo "OK: loadVersions 保留"; else echo "FAIL: loadVersions 丢失"; exit 1; fi
echo "--- guides.js slug 计数（参考，真实篇数以运行时为准）---"
echo "  slug: 出现 $(grep -c 'slug:' "$APP/content/guides.js" 2>/dev/null || echo 0) 次"

step "5/9 docker build（npmmirror，约 2-4 分钟）"
cd "$APP" || exit 1
sudo docker build --build-arg CACHEBUST=$(date +%s) -t yilan:latest . > /tmp/docker-build.log 2>&1
BE=$?
echo "docker build EXIT=$BE"
if [ $BE -ne 0 ]; then echo "BUILD_FAIL 末尾日志:"; tail -40 /tmp/docker-build.log; exit 1; fi
tail -5 /tmp/docker-build.log

step "6/9 停旧容器 + 起新容器（-p 127.0.0.1:3000:3000，让 Caddy 接管 80/443）"
sudo docker rm -f yilan 2>/dev/null || true
sudo docker run -d --name yilan --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  -v /opt/yilan/data/social:/app/data/social \
  yilan:latest && echo "RUN_OK" || { echo "RUN_FAIL"; exit 1; }

step "7/9 等待启动 + 状态"
sleep 10
sudo docker ps --filter name=yilan --format '{{.Names}} | {{.Status}} | {{.Ports}}'
echo "--- 容器日志末尾 15 行 ---"
sudo docker logs yilan 2>&1 | tail -15

step "8/9 本机自测（80 端口）"
CODE=$(curl -s -o /tmp/home-probe.html -w "%{http_code}" --max-time 25 http://127.0.0.1/)
echo "HTTP / = $CODE"
[ "$CODE" = "200" ] || { echo "HOME_PROBE_FAIL"; tail -20 /tmp/home-probe.html; exit 1; }
echo "--- 应保留标记 ---"
for kw in "S18" "dual-entry" "info-gap" "compCode"; do echo "  $kw : $(grep -c "$kw" /tmp/home-probe.html || true) 次"; done
echo "--- 应删除标记（应为 0）---"
for kw in "VersionOnePager" "/versions" "/changelog" "版本速报"; do echo "  $kw : $(grep -c "$kw" /tmp/home-probe.html || true) 次"; done

step "9/9 /guides 新内容验证（新攻略标题应出现）"
GC=$(curl -s --max-time 25 http://127.0.0.1/guides -o /tmp/guides-probe.html -w "%{http_code}")
echo "HTTP /guides = $GC"
for t in "厄斐琉斯" "Aphelios" "阿狸" "Ahri" "蕾欧娜" "Leona" "德莱文" "Draven"; do
  if grep -q "$t" /tmp/guides-probe.html; then echo "  OK $t 命中"; else echo "  WARN $t 未命中"; fi
done
echo "--- /guides 响应头 Cache-Control（应为 no-store）---"
curl -s -I --max-time 15 http://127.0.0.1/guides | grep -i "cache-control" || echo "  (无 cache-control 头)"

echo ""
echo "DEPLOY_SCRIPT_DONE"
