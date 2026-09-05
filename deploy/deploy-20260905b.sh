#!/bin/bash
# 弈览部署脚本 2026-09-05 21:28 版 — 目标：把 d9f6ebe（移除版本页）上线
# 用法：bash /tmp/deploy-20260905b.sh > /tmp/deploy-run.log 2>&1
set -u
TS=20260905_2128
APP=/opt/yilan/app
BAK=/opt/yilan/app.bak.$TS
TAR=/tmp/yilan-src.tgz

step() { echo ""; echo "===== [STEP] $1 ====="; }

step "1/8 备份当前 app -> $BAK"
if [ -d "$BAK" ]; then echo "备份已存在，先删除旧备份"; sudo rm -rf "$BAK"; fi
sudo cp -a "$APP" "$BAK" && echo "BACKUP_OK" || { echo "BACKUP_FAIL"; exit 1; }

step "2/8 清空 app（保留挂载数据 /opt/yilan/data，它在外面）"
sudo find "$APP" -mindepth 1 -maxdepth 1 -exec rm -rf {} + && echo "CLEAN_OK" || { echo "CLEAN_FAIL"; exit 1; }

step "3/8 解压新源码（sha256 必须为 aa0d056e3edd664f130a492e077596ac7394929be079406f83093e9fe7c3b780）"
echo "$TAR 实际 sha256:"
sudo sha256sum "$TAR"
sudo tar -xzf "$TAR" -C "$APP" && echo "EXTRACT_OK" || { echo "EXTRACT_FAIL"; exit 1; }
sudo chown -R ubuntu:ubuntu "$APP"

step "4/8 抽查关键文件（确认 d9f6ebe 内容已就位）"
echo "--- VersionOnePager.js 应不存在 ---"
[ ! -f "$APP/components/VersionOnePager.js" ] && echo "OK: VersionOnePager 已删除" || { echo "FAIL: VersionOnePager 还在"; exit 1; }
echo "--- app/versions/ 应不存在 ---"
[ ! -d "$APP/app/versions" ] && echo "OK: app/versions 已删除" || { echo "FAIL: app/versions 还在"; exit 1; }
echo "--- app/page.js 不应包含 VersionOnePager ---"
if grep -q "VersionOnePager" "$APP/app/page.js"; then echo "FAIL: page.js 还引用 VersionOnePager"; exit 1; else echo "OK: page.js 已无 VersionOnePager"; fi
echo "--- SiteNav 不应包含 /versions 导航 ---"
if grep -q "'/versions'" "$APP/components/SiteNav.js"; then echo "FAIL: SiteNav 还有版本导航"; exit 1; else echo "OK: SiteNav 已无版本导航"; fi
echo "--- loadVersions 应保留（首页筛选依赖）---"
grep -q "loadVersions" "$APP/app/page.js" && echo "OK: loadVersions 保留" || { echo "FAIL: loadVersions 被误删"; exit 1; }

step "5/8 docker build（约 2-4 分钟，走 npmmirror）"
cd "$APP" || exit 1
sudo docker build -t yilan:latest . > /tmp/docker-build.log 2>&1
BUILD_EXIT=$?
echo "docker build EXIT=$BUILD_EXIT"
if [ $BUILD_EXIT -ne 0 ]; then echo "BUILD_FAIL，最后 40 行日志："; tail -40 /tmp/docker-build.log; exit 1; fi
tail -5 /tmp/docker-build.log

step "6/8 停旧容器 + 删 + 起新容器（同挂载同端口）"
sudo docker stop yilan && sudo docker rm yilan || { echo "STOP_OLD_FAIL"; exit 1; }
sudo docker run -d --name yilan --restart unless-stopped \
  -p 80:3000 \
  -v /opt/yilan/data/social:/app/data/social \
  yilan:latest && echo "RUN_OK" || { echo "RUN_FAIL"; exit 1; }

step "7/8 等待启动 + 容器状态"
sleep 8
sudo docker ps --filter name=yilan --format '{{.Names}} | {{.Status}} | {{.Ports}}'
echo "--- 容器日志最后 12 行 ---"
sudo docker logs yilan 2>&1 | tail -12

step "8/8 外部验证：容器内 curl 80 端口（本机自测）"
CODE=$(curl -s -o /tmp/home-probe.html -w "%{http_code}" --max-time 20 http://127.0.0.1/)
echo "本机 80 端口 HTTP=$CODE"
if [ "$CODE" != "200" ]; then echo "PROBE_FAIL"; tail -20 /tmp/home-probe.html; exit 1; fi
echo "--- 关键标记检查（应为 0 次）---"
for kw in "VersionOnePager" "/versions" "/changelog" "版本速报"; do
  n=$(grep -c "$kw" /tmp/home-probe.html || true)
  echo "  $kw : $n 次"
done
echo "--- 应保留的标记（应 >0 次）---"
for kw in "dual-entry" "info-gap" "compCode" "S18"; do
  n=$(grep -c "$kw" /tmp/home-probe.html || true)
  echo "  $kw : $n 次"
done
echo ""
echo "DEPLOY_SCRIPT_DONE"
