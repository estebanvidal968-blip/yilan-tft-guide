#!/usr/bin/env python3
"""统计 content/guides.js 中攻略 slug 去重数（兼容 "slug": 与 slug: 两种键格式）。"""
import re, sys
p = sys.argv[1] if len(sys.argv) > 1 else 'content/guides.js'
d = open(p, encoding='utf-8', errors='replace').read()
m = re.findall(r'["\']?slug["\']?\s*:\s*["\']([A-Za-z0-9\-]+)["\']', d)
print(len(set(m)))