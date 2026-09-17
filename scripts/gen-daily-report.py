#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成弈览「每日流量」极简报表（HTML，自包含 + Chart.js CDN）。
目标：只呈现站长最想看的东西 —— 每日 PV / UV + 趋势 + 近期明细。
清洗规则与 analyze-access-log.py 保持一致（剔除扫描 / 静态 / 爬虫 / 非2xx）。

用法：python3 gen-daily-report.py <access.log> <out.html>
"""
import json
import sys
import re
import datetime
import collections

TZ = datetime.timezone(datetime.timedelta(hours=8))
ALLOWED_HOSTS = ('yilangames.com', 'www.yilangames.com')

SEARCH_BOT = ['baiduspider', 'bytespider', 'sogou', '360spider', 'yisou', 'bingbot',
              'googlebot', 'googleother', 'google-extended', 'petalbot', 'yandex',
              'duckduckbot', 'slurp', 'applebot', 'semrush', 'ahrefs', 'mj12',
              'dotbot', 'seznambot', 'qwantify']
OTHER_BOT = ['curl', 'wget', 'python-requests', 'python-urllib', 'python/', 'go-http-client',
              'scrapy', 'httpie', 'okhttp', 'java/', 'libwww-perl', 'scanner', 'nmap', 'masscan',
              'crawler', 'spider', 'bot/', 'headlesschrome', 'monitoring', 'uptimerobot',
              'zgrab', 'censys', 'internetmeasurement', 'researchscan', 'census',
              'node-fetch', 'axios', 'reqwest', 'check_http', 'nagios', 'feedly']
SCAN_PATH = re.compile(
    r'/(wp-admin|wp-login|wp-content|wordpress|xmlrpc\.php|phpmyadmin|pma|adminer|'
    r'\.env|\.git|\.svn|\.DS_Store|\.aws|\.ssh|\.bak|\.old|\.sql|'
    r'config\.json|config\.yml|aws\.yml|backup|database|'
    r'boaform|solr|actuator|telerik|jaws|console|manager/html|hudson|jenkins|'
    r'vendor/|owa|autodiscover|ecp|HNAP1|GponForm|_ignition|'
    r'muieblackcat|bower_components|passwd|shadow|'
    r'install\.php|setup\.php|edit\.php|admin\.php|login\.php|user\.php|eval|shell)', re.I)
STATIC_EXT = re.compile(r'\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|json|map|txt|xml)$', re.I)


def is_bot(ua):
    u = (ua or '').lower()
    return any(k in u for k in SEARCH_BOT) or any(k in u for k in OTHER_BOT)


def classify_src(ref, ua):
    if not ref:
        return 'direct'
    rl = ref.lower()
    if 'micromessenger' in (ua or '').lower() or any(k in rl for k in ['mp.weixin', 'weixin', 'mp.wechat']):
        return 'wechat'
    if any(k in rl for k in ['baidu.com', 'baiducontent', 'bdstatic']):
        return 'baidu'
    if 'bing.com' in rl:
        return 'bing'
    if 'google.com' in rl:
        return 'google'
    if 'sogou.com' in rl:
        return 'sogou'
    if 'yilangames.com' in ref:
        return 'internal'
    return 'other'


def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    src, dst = sys.argv[1], sys.argv[2]

    day_pv = collections.Counter()
    day_uv = collections.defaultdict(set)
    day_src = collections.defaultdict(lambda: collections.Counter())
    total_pv = total_uv = 0

    with open(src, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
            except Exception:
                continue
            req = d.get('request', {}) or {}
            hdrs = req.get('headers', {}) or {}
            host = req.get('host', '')
            if host not in ALLOWED_HOSTS:
                continue
            uri = req.get('uri', '/') or '/'
            if STATIC_EXT.search(uri.split('?')[0]) or uri.startswith('/_next/') or uri.startswith('/api/'):
                continue
            if SCAN_PATH.search(uri):
                continue
            ua_list = hdrs.get('User-Agent', ['']) or ['']
            ua = ua_list[0] if isinstance(ua_list, list) else str(ua_list)
            if is_bot(ua):
                continue
            status = d.get('status', 0)
            if status >= 400 or status < 200:
                continue
            ts = d.get('ts', 0)
            dt = datetime.datetime.fromtimestamp(ts, TZ)
            day = dt.strftime('%Y-%m-%d')
            fp = req.get('remote_ip', '') + '|' + ua[:80]
            day_pv[day] += 1
            day_uv[day].add(fp)
            ref_list = hdrs.get('Referer', []) or []
            ref = ref_list[0] if ref_list else ''
            day_src[day][classify_src(ref, ua)] += 1
            total_pv += 1
            total_uv += 0  # 仅按日去重，跨日不含

    days = sorted(day_pv.keys())
    if not days:
        print('[gen-daily-report] 无有效数据'); sys.exit(0)

    labels = days
    pv = [day_pv[d] for d in days]
    uv = [len(day_uv[d]) for d in days]
    last = days[-1]
    prev = days[-2] if len(days) > 1 else None

    def delta_today(key):
        cur = {'pv': day_pv[last], 'uv': len(day_uv[last])}[key]
        if not prev:
            return None
        base = {'pv': day_pv[prev], 'uv': len(day_uv[prev])}[key]
        if base == 0:
            return None
        return round((cur - base) / base * 100, 1)

    today_pv, today_uv = day_pv[last], len(day_uv[last])
    pv_delta = delta_today('pv')
    uv_delta = delta_today('uv')
    week_avg_pv = round(sum(pv) / len(pv))
    week_avg_uv = round(sum(uv) / len(uv))
    last_src = day_src[last]

    def fmt_delta(v):
        if v is None:
            return '—'
        sign = '+' if v >= 0 else ''
        return f'{sign}{v}%'

    # 明细表行
    rows = ''
    for d in reversed(days):
        s = day_src[d]
        rows += (f"<tr><td>{d}</td><td>{day_pv[d]}</td><td>{len(day_uv[d])}</td>"
                 f"<td>{s.get('direct',0)}</td><td>{s.get('baidu',0)+s.get('bing',0)+s.get('google',0)+s.get('sogou',0)}</td>"
                 f"<td>{s.get('wechat',0)}</td><td>{s.get('internal',0)+s.get('other',0)}</td></tr>")

    now = datetime.datetime.now(TZ).strftime('%Y-%m-%d %H:%M')
    html = f"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>弈览 · 每日流量</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>
* {{ box-sizing: border-box; }}
body {{ font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; background:#FAF8F2; color:#2C2C2A; margin:0; padding:28px 18px; }}
.wrap {{ max-width:840px; margin:0 auto; }}
h1 {{ font-size:20px; font-weight:600; margin:0 0 4px; }}
.sub {{ color:#888780; font-size:13px; margin-bottom:22px; }}
.cards {{ display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:26px; }}
.card {{ background:#fff; border:1px solid #E3E0D6; border-radius:12px; padding:14px 16px; }}
.card .k {{ font-size:12px; color:#888780; }}
.card .v {{ font-size:24px; font-weight:600; margin-top:4px; }}
.card .d {{ font-size:12px; margin-top:2px; }}
.up {{ color:#3B6D11; }} .down {{ color:#A32D2D; }} .flat {{ color:#888780; }}
.chartbox {{ background:#fff; border:1px solid #E3E0D6; border-radius:12px; padding:18px 16px; margin-bottom:26px; }}
table {{ width:100%; border-collapse:collapse; font-size:13px; background:#fff; border:1px solid #E3E0D6; border-radius:12px; overflow:hidden; }}
th,td {{ padding:9px 12px; text-align:right; border-bottom:1px solid #EFEDE4; }}
th:first-child,td:first-child {{ text-align:left; }}
th {{ background:#F4F1EA; color:#5F5E5A; font-weight:600; }}
tr:last-child td {{ border-bottom:none; }}
.foot {{ color:#aaa; font-size:12px; margin-top:18px; text-align:center; }}
a {{ color:#185FA5; }}
</style></head>
<body><div class="wrap">
<h1>弈览 · 每日流量</h1>
<div class="sub">数据更新：{now}（UTC+8）｜ 已剔除漏洞扫描 / 爬虫 / 静态资源，仅统计真人访问</div>
<div class="cards">
  <div class="card"><div class="k">今日浏览量 PV</div><div class="v">{today_pv}</div><div class="d {('up' if (pv_delta or 0)>=0 else 'down')}">较昨日 {fmt_delta(pv_delta)}</div></div>
  <div class="card"><div class="k">今日访客 UV</div><div class="v">{today_uv}</div><div class="d {('up' if (uv_delta or 0)>=0 else 'down')}">较昨日 {fmt_delta(uv_delta)}</div></div>
  <div class="card"><div class="k">日均 PV（全周期）</div><div class="v">{week_avg_pv}</div><div class="d flat">{len(days)} 天均值</div></div>
  <div class="card"><div class="k">日均 UV（全周期）</div><div class="v">{week_avg_uv}</div><div class="d flat">{len(days)} 天均值</div></div>
</div>
<div class="chartbox"><canvas id="trend" height="150"></canvas></div>
<table>
  <thead><tr><th>日期</th><th>PV</th><th>UV</th><th>直接访问</th><th>搜索引擎</th><th>微信</th><th>其他</th></tr></thead>
  <tbody>{rows}</tbody>
</table>
<div class="foot">更多维度（设备 / 浏览器 / 实时在线 / 地理）见 <a href="goaccess.html">全功能分析页 →</a></div>
</div>
<script>
new Chart(document.getElementById('trend'), {{
  type:'bar',
  data:{{ labels:{labels},
    datasets:[
      {{ type:'bar', label:'PV', data:{pv}, backgroundColor:'#185FA5', borderRadius:4, order:2 }},
      {{ type:'line', label:'UV', data:{uv}, borderColor:'#0F6E56', backgroundColor:'#0F6E56', borderWidth:2, pointRadius:4, pointStyle:'triangle', tension:0.3, order:1 }}
    ]}},
  options:{{ responsive:true, plugins:{{ legend:{{ position:'top', labels:{{ boxWidth:12, font:{{ size:12 }} }} }} }},
    scales:{{ x:{{ grid:{{ display:false }}, ticks:{{ maxRotation:40, font:{{ size:11 }} }} }},
      y:{{ beginAtZero:true, ticks:{{ precision:0 }} }} }} }}
}});
</script>
</body></html>"""
    with open(dst, 'w', encoding='utf-8') as fo:
        fo.write(html)
    sys.stderr.write(f'[gen-daily-report] 输出 {dst}：{len(days)} 天，今日 PV {today_pv} / UV {today_uv}\n')


if __name__ == '__main__':
    main()
