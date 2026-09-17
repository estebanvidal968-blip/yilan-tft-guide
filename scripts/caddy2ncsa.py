#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 Caddy JSON 访问日志转换成 NCSA Combined 格式，供 GoAccess 消费。

设计要点：
- 不直接让 GoAccess 解析 Caddy JSON（1.5.5 的 JSON 模板在字段缺失时极易错行），
  先由本脚本做标准化与清洗，输出 GoAccess 100% 兼容的 COMBINED 格式。
- 清洗策略：剔除静态资源、漏洞扫描探测、爬虫与工具请求、4xx/5xx。
  目标是让 GoAccess 仪表盘呈现的完全是「真人行为」。

用法：
    python3 caddy2ncsa.py <input.log> <output.log>
"""
import json
import sys
import re
import datetime

TZ = datetime.timezone(datetime.timedelta(hours=8))
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

# 允许的主机名（排除 IP 直访与其它同机站点）
ALLOWED_HOSTS = ('yilangames.com', 'www.yilangames.com')

# 搜索引擎爬虫
SEARCH_BOT = [
    'baiduspider', 'bytespider', 'sogou', '360spider', 'yisou', 'bingbot',
    'googlebot', 'googleother', 'google-extended', 'petalbot', 'yandex',
    'duckduckbot', 'slurp', 'applebot', 'semrush', 'ahrefs', 'mj12',
    'dotbot', 'seznambot', 'qwantify',
]
# 工具型 / 非浏览器请求
OTHER_BOT = [
    'curl', 'wget', 'python-requests', 'python-urllib', 'python/', 'go-http-client',
    'scrapy', 'httpie', 'okhttp', 'java/', 'libwww-perl', 'scanner', 'nmap', 'masscan',
    'crawler', 'spider', 'bot/', 'headlesschrome', 'monitoring', 'uptimerobot',
    'zgrab', 'censys', 'internetmeasurement', 'researchscan', 'census',
    'node-fetch', 'axios', 'reqwest', 'check_http', 'nagios', 'feedly',
]

# 漏洞扫描 / 探测路径（伪装成浏览器的自动化攻击）
SCAN_PATH = re.compile(
    r'/(wp-admin|wp-login|wp-content|wordpress|xmlrpc\.php|phpmyadmin|pma|adminer|'
    r'\.env|\.git|\.svn|\.DS_Store|\.aws|\.ssh|\.bak|\.old|\.sql|'
    r'config\.json|config\.yml|aws\.yml|backup|database|'
    r'boaform|solr|actuator|telerik|jaws|console|manager/html|hudson|jenkins|'
    r'vendor/|owa|autodiscover|ecp|HNAP1|GponForm|_ignition|'
    r'muieblackcat|bower_components|passwd|shadow|'
    r'install\.php|setup\.php|edit\.php|admin\.php|login\.php|user\.php|eval|shell)', re.I)

STATIC_EXT = re.compile(
    r'\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|json|map|txt|xml)$', re.I)


def is_bot(ua):
    u = (ua or '').lower()
    if any(k in u for k in SEARCH_BOT):
        return True
    if any(k in u for k in OTHER_BOT):
        return True
    return False


def ncsa_line(ts, ip, method, uri, proto, status, size, referer, ua):
    dt = datetime.datetime.fromtimestamp(ts, TZ)
    # 请求行里的 URI 必须做空格转义，否则会破坏 NCSA 字段分隔
    req = '%s %s %s' % (method, uri.replace(' ', '%20'), proto)
    ref = (referer or '-').replace('"', '%22')
    agent = (ua or '-').replace('"', '%22')
    return '%s - - [%02d/%s/%d:%02d:%02d:%02d +0800] "%s" %s %s "%s" "%s"' % (
        ip, dt.day, MONTHS[dt.month - 1], dt.year,
        dt.hour, dt.minute, dt.second,
        req, status, size, ref, agent)


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src, dst = sys.argv[1], sys.argv[2]

    kept = total = skipped_static = skipped_bot = skipped_scan = skipped_status = skipped_host = 0

    with open(src, 'r', encoding='utf-8', errors='replace') as fi, \
            open(dst, 'w', encoding='utf-8') as fo:
        for line in fi:
            line = line.strip()
            if not line:
                continue
            total += 1
            try:
                d = json.loads(line)
            except Exception:
                continue

            req = d.get('request', {}) or {}
            hdrs = req.get('headers', {}) or {}

            host = req.get('host', '') or ''
            if host not in ALLOWED_HOSTS:
                skipped_host += 1
                continue

            uri = req.get('uri', '/') or '/'
            path_uri = uri.split('?')[0]

            if STATIC_EXT.search(path_uri) or path_uri.startswith('/_next/') or path_uri.startswith('/api/'):
                skipped_static += 1
                continue
            if SCAN_PATH.search(uri):
                skipped_scan += 1
                continue

            ua_list = hdrs.get('User-Agent', ['']) or ['']
            ua = ua_list[0] if isinstance(ua_list, list) else str(ua_list)
            if is_bot(ua):
                skipped_bot += 1
                continue

            status = d.get('status', 0)
            if status >= 400 or status < 200:
                skipped_status += 1
                continue

            ref_list = hdrs.get('Referer', []) or []
            referer = ref_list[0] if ref_list else '-'

            fo.write(ncsa_line(
                d.get('ts', 0),
                req.get('remote_ip', '-'),
                req.get('method', 'GET'),
                uri,
                req.get('proto', 'HTTP/1.1'),
                status,
                d.get('size', 0) or 0,
                referer,
                ua,
            ) + '\n')
            kept += 1

    sys.stderr.write(
        '[caddy2ncsa] 总行 %d → 保留 %d ｜ 剔除: 静态 %d / 扫描 %d / 爬虫 %d / 非2xx %d / 其它主机 %d\n'
        % (total, kept, skipped_static, skipped_scan, skipped_bot, skipped_status, skipped_host))


if __name__ == '__main__':
    main()
