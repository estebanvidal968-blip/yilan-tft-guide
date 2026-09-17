#!/bin/bash
# ============================================================
# 弈览 · 访问统计报表刷新
# ------------------------------------------------------------
# 流程：Caddy JSON 日志（含滚动历史 .gz）
#        → caddy2ncsa.py（清洗 + 转 NCSA Combined）
#        → GoAccess（生成自包含 HTML 仪表盘）
# 必须以 root 运行（/var/log/caddy 仅 root 可读）
# ============================================================
set -u

STATS_DIR=/opt/yilan/stats
LOG_GLOB='/var/log/caddy/yilan-access.log'
OUT_DIR=/var/www/yilan-stats
TMP="$(mktemp -d)"
WORK="$TMP/combined.log"
PART="$TMP/part.log"
RAW="$TMP/raw.log"

cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

: > "$WORK"
count=0

# 当前日志 + Caddy 滚动历史（Caddy 滚动产物为 .gz）
for f in $(ls -1tr ${LOG_GLOB}* 2>/dev/null); do
    case "$f" in
        *.gz) zcat "$f" > "$RAW" 2>/dev/null || continue ;;
        *)    cat  "$f" > "$RAW" 2>/dev/null || continue ;;
    esac
    python3 "$STATS_DIR/caddy2ncsa.py" "$RAW" "$PART" 2>&1
    [ -s "$PART" ] && cat "$PART" >> "$WORK"
    count=$((count + 1))
done

if [ ! -s "$WORK" ]; then
    echo "[$(date '+%F %T')] 无有效数据，跳过生成"
    exit 0
fi

mkdir -p "$OUT_DIR"

# GoAccess 1.5.5 静态 HTML 报告
# --no-query-string  带 ? 的 URL 归一化，避免同一页面被拆成多条
# --ignore-crawlers  二次兜底过滤爬虫
# 注：不使用 --anonymize-ip —— 自建站点管理员需要看到真实 IP 以排查问题，
#     该报表已由 Caddy basicauth 保护，不对公网开放。
goaccess "$WORK" \
    --log-format=COMBINED \
    --no-query-string \
    --no-csv-summary \
    --no-ip-validation \
    --ignore-crawlers \
    --date-spec=hr \
    --ignore-panel=REQUESTS_STATIC \
    --html-report-title="弈览 yilangames.com · 访问统计" \
    --html-prefs='{"theme":"bright"}' \
    -o "$OUT_DIR/index.html" 2>&1

if [ -s "$OUT_DIR/index.html" ]; then
    echo "[$(date '+%F %T')] 报表已更新：$OUT_DIR/index.html（$(wc -l < "$WORK") 行 / 源文件 $count 个）"
else
    echo "[$(date '+%F %T')] 生成失败"
    exit 1
fi
