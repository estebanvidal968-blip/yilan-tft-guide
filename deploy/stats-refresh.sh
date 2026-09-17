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
RAWALL="$TMP/rawall.log"   # 原始 JSON 拼接（极简页直接读，不依赖 NCSA 转换）

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
    cat "$RAW" >> "$RAWALL"
    count=$((count + 1))
done

if [ ! -s "$WORK" ]; then
    echo "[$(date '+%F %T')] 无有效数据，跳过生成"
    exit 0
fi

mkdir -p "$OUT_DIR"

# ① 极简「每日流量」页 —— 作为 /stats/ 默认入口（index.html）
# 只给站长最关心的：每日 PV/UV 趋势 + 今日数字 + 近期明细，不堆面板
python3 "$STATS_DIR/gen-daily-report.py" "$RAWALL" "$OUT_DIR/index.html" 2>&1
if [ -s "$OUT_DIR/index.html" ]; then
    echo "[$(date '+%F %T')] 每日流量页已更新：$OUT_DIR/index.html"
else
    echo "[$(date '+%F %T')] 每日流量页生成失败"
    exit 1
fi

# ② GoAccess 全功能分析页 —— 挪到 goaccess.html（深度分析时再用）
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
    --html-report-title="弈览 yilangames.com · 访问统计（全功能）" \
    --html-prefs='{"theme":"bright"}' \
    -o "$OUT_DIR/goaccess.html" 2>&1

if [ -s "$OUT_DIR/goaccess.html" ]; then
    echo "[$(date '+%F %T')] 全功能页已更新：$OUT_DIR/goaccess.html（$(wc -l < "$WORK") 行 / 源文件 $count 个）"
else
    echo "[$(date '+%F %T')] 全功能页生成失败"
    exit 1
fi
