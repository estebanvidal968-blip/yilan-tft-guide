#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""分析 Caddy JSON 访问日志，输出弈览站点浏览数据报告。"""
import json, sys, datetime, collections, re

LOG = sys.argv[1] if len(sys.argv) > 1 else '/var/log/caddy/yilan-access.log'
TZ = datetime.timezone(datetime.timedelta(hours=8))

# ---- 爬虫 / 机器人判定 ----
SEARCH_BOT = [
    ('baiduspider', '百度'), ('bytespider', '字节'), ('sogou', '搜狗'),
    ('360spider', '360'), ('yisou', '神马/UC'), ('bingbot', 'Bing'),
    ('googlebot', 'Google'), ('googleother', 'Google'), ('google-extended', 'Google'),
    ('petalbot', '华为花瓣'), ('yandex', 'Yandex'), ('duckduckbot', 'DuckDuckGo'),
    ('slurp', 'Yahoo'), ('applebot', 'Apple'), ('semrush', 'Semrush'),
    ('ahrefs', 'Ahrefs'), ('mj12', 'Majestic'), ('dotbot', 'DotBot'),
    ('seznambot', 'Seznam'), ('qwantify', 'Qwant'),
]
OTHER_BOT = [
    'curl', 'wget', 'python-requests', 'python-urllib', 'python/', 'go-http-client',
    'scrapy', 'httpie', 'okhttp', 'java/', 'libwww-perl', 'scanner', 'nmap', 'masscan',
    'crawler', 'spider', 'bot/', 'headlesschrome', 'monitoring', 'uptimerobot',
    'zgrab', 'censys', 'internetmeasurement', 'researchscan', 'census',
    'node-fetch', 'axios', 'reqwest', 'check_http', 'nagios', 'feedly', 'rss',
]

def classify(ua):
    u = (ua or '').lower()
    for kw, name in SEARCH_BOT:
        if kw in u:
            return ('search', name)
    for kw in OTHER_BOT:
        if kw in u:
            return ('tool', kw)
    return ('human', None)

def host_of(uri):
    """去掉 /_next 静态资源与 api，保留真实页面路径"""
    if uri.startswith('/_next/') or uri.startswith('/api/'):
        return None
    return uri.split('?')[0]

def is_static(uri):
    return bool(re.search(r'\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|json|map|txt|xml)$',
                          uri.split('?')[0], re.I))

# ---- 漏洞扫描 / 探测路径（伪装成浏览器的自动化攻击，必须剔除）----
SCAN_PATH = re.compile(
    r'/(wp-admin|wp-login|wp-content|wordpress|xmlrpc\.php|phpmyadmin|pma|adminer|'
    r'\.env|\.git|\.svn|\.DS_Store|\.aws|\.ssh|\.bak|\.old|\.sql|'
    r'config\.json|config\.yml|aws\.yml|backup|database|'
    r'boaform|solr|actuator|telerik|jaws|console|manager/html|hudson|jenkins|'
    r'vendor/|owa|autodiscover|ecp|HNAP1|GponForm|_ignition|'
    r'muieblackcat|bower_components|passwd|shadow|'
    r'install\.php|setup\.php|edit\.php|admin\.php|login\.php|user\.php|eval|shell)', re.I)

def main():
    total = bad = 0
    day_pv_this_day = collections.Counter()      # 'YYYY-MM-DD' -> 请求数(非静态)
    day_uv = collections.defaultdict(set)        # day -> {指纹}
    src_counter = collections.Counter()          # 来源分类 -> count (human, 页面级)
    page_counter = collections.Counter()         # uri -> count (human, 页面级)
    referer_counter = collections.Counter()      # host -> count
    search_bot_counter = collections.Counter()   # bot 名 -> count
    tool_bot_counter = collections.Counter()
    device = collections.Counter()               # 设备分类
    status_counter = collections.Counter()
    scan_counter = collections.Counter()         # 漏洞探测路径 -> count

    with open(LOG, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            total += 1
            try:
                d = json.loads(line)
            except Exception:
                bad += 1
                continue
            req = d.get('request', {}) or {}
            ua_list = (req.get('headers', {}) or {}).get('User-Agent', ['']) or ['']
            ua = ua_list[0] if isinstance(ua_list, list) else str(ua_list)
            ref_list = (req.get('headers', {}) or {}).get('Referer', []) or []
            ref = ref_list[0] if ref_list else ''
            ip = req.get('remote_ip', '')
            uri = req.get('uri', '/')
            ts = d.get('ts', 0)
            dt = datetime.datetime.fromtimestamp(ts, TZ)
            day = dt.strftime('%Y-%m-%d')
            status = d.get('status', 0)
            kind, label = classify(ua)

            status_counter[status] += 1

            if kind == 'search':
                search_bot_counter[label] += 1
                continue
            if kind == 'tool':
                tool_bot_counter[label] += 1
                continue

            path = host_of(uri)
            if path is None or is_static(uri):
                continue
            if SCAN_PATH.search(uri):
                scan_counter[uri.split('?')[0]] += 1
                continue
            if status >= 400 or status < 200:
                continue
            if status >= 300:
                continue

            fp = ip + '|' + (ua or '')[:80]
            day_pv_this_day[day] += 1
            day_uv[day].add(fp)

            # 设备
            ul = (ua or '').lower()
            if 'micromessenger' in ul:
                device['微信内置'] += 1
            elif 'weibo' in ul:
                device['微博内置'] += 1
            elif re.search(r'iphone|ipad|android|mobile', ul):
                device['手机浏览器'] += 1
            else:
                device['桌面浏览器'] += 1

            # 来源
            if not ref:
                src_counter['直接访问'] += 1
            else:
                rh = re.sub(r'^https?://', '', ref).split('/')[0]
                referer_counter[rh] += 1
                rl = ref.lower()
                if any(k in rl for k in ['baidu.com', 'baiducontent', 'bdstatic']):
                    src_counter['百度搜索'] += 1
                elif 'bing.com' in rl:
                    src_counter['Bing'] += 1
                elif 'google.com' in rl:
                    src_counter['Google'] += 1
                elif 'sogou.com' in rl:
                    src_counter['搜狗'] += 1
                elif any(k in rl for k in ['sm.cn', 'uc.cn']):
                    src_counter['神马/UC'] += 1
                elif any(k in rl for k in ['mp.weixin', 'weixin', 'mp.wechat']):
                    src_counter['微信生态'] += 1
                elif 'yilangames.com' in rh:
                    src_counter['站内跳转'] += 1
                else:
                    src_counter['其他外链'] += 1

            page_counter[path] += 1

    days = sorted(day_uv.keys())
    print('=' * 56)
    print('弈览 yilangames.com 浏览数据报告（来源：Caddy 访问日志）')
    print('统计时区 UTC+8 ｜ 生成', datetime.datetime.now(TZ).strftime('%Y-%m-%d %H:%M'))
    print('=' * 56)
    print('\n[日志概况]')
    print(f'  原始请求行  : {total}')
    print(f'  解析失败行  : {bad}')
    print(f'  覆盖日期    : {days[0]} ~ {days[-1]}（共 {len(days)} 天）' if days else '  无有效数据')

    print('\n[每日 PV / UV]（已剔除爬虫、静态资源、3xx）')
    print(f"  {'日期':<12}{'PV':>8}{'UV(独立访客)':>14}")
    if days:
        tot_pv = tot_uv = 0
        for dd in days:
            pv = day_pv_this_day[dd]
            uv = len(day_uv[dd])
            tot_pv += pv
            tot_uv += uv
            print(f'  {dd:<12}{pv:>8}{uv:>14}')
        print(f"  {'合计':<12}{tot_pv:>8}{tot_uv:>13}( UV 为每日独立之和，含跨日重复 )")
    if days:
        print('\n  今日(%s)：PV %d ／ UV %d' % (days[-1], day_pv_this_day[days[-1]], len(day_uv[days[-1]])))

    print('\n[热门页面 Top 15]')
    for i, (p, c) in enumerate(page_counter.most_common(15), 1):
        print(f'  {i:>2}. {c:>5}  {p}')

    print('\n[流量来源]')
    s = sum(src_counter.values()) or 1
    for k, v in src_counter.most_common():
        print(f'  {k:<12}{v:>6}  ({v * 100 / s:.1f}%)')

    print('\n[外部引荐 Host Top 8]')
    for k, v in referer_counter.most_common(8):
        print(f'  {v:>5}  {k}')

    print('\n[设备 / 端]')
    tt = sum(device.values()) or 1
    for k, v in device.most_common():
        print(f'  {k:<12}{v:>6}  ({v * 100 / tt:.1f}%)')

    print('\n[搜索引擎爬虫来访次数]（SEO 收录信号）')
    if search_bot_counter:
        for k, v in search_bot_counter.most_common():
            print(f'  {k:<14}{v:>6}')
    else:
        print('  无')

    print('\n[其他工具型请求]')
    for k, v in tool_bot_counter.most_common(8):
        print(f'  {k:<20}{v:>6}')
    print(f'  工具类合计 {sum(tool_bot_counter.values())}')

    print('\n[已剔除：漏洞扫描 / 探测请求]')
    if scan_counter:
        sc = sum(scan_counter.values())
        for k, v in scan_counter.most_common(10):
            print(f'  {v:>5}  {k}')
        print(f'  合计 {sc} 次（伪装浏览器 UA 的自动化攻击，非真人，已从 PV/UV 中剔除）')
    else:
        print('  无')

    print('\n[HTTP 状态码分布]（全部请求）')
    for k, v in sorted(status_counter.items(), key=lambda x: -x[1])[:8]:
        print(f'  {k:<6}{v:>7}')

if __name__ == '__main__':
    main()
