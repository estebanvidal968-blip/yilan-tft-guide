# -*- coding: utf-8 -*-
"""
给 content/guides.js 的每篇攻略注入 cover（封面模板数据）。

模板字段（每篇只填这些，换内容即可）：
  kind   '装备' | '经济' | '运营' | '弈子' | '机制'   决定品类主色 + 几何符号
  stat   { v, k }                                     关键数字 + 单位（扫读锚点）
  icons  [{ t: 'item'|'aug'|'champ', n: 名称 }]       官方图标，最多 3 个
  hook   一句话钩子（不填则回落 subtitle）

幂等：已存在 cover 的篇目会跳过。
所有名称均已过真源 data/tft/{items,augments,champs}.json 校验。
"""
import re
import io
import sys

PATH = "content/guides.js"

# slug -> cover
# icons 的 n 全部来自真源：装备 items.json(140) / 符文 augments.json(283) / 棋子 champs.json(55)
COVERS = {
    # ---------- 原 9 篇 ----------
    "high-transmute": dict(kind="机制", stat=("0", "费点化"), icons=[], hook="三星 4 费直点三星 5 费"),
    "rune-comp-matrix": dict(kind="机制", stat=("283", "枚符文"), icons=[("aug", "珍藏财宝 III"), ("aug", "大百宝袋")], hook="哪个符文配哪套阵容"),
    "item-synergy": dict(kind="装备", stat=("3", "组黄金搭配"), icons=[("item", "鬼索的狂暴之刃"), ("item", "死亡之刃"), ("item", "最后的轻语")], hook="单件平庸，凑对才起飞"),
    "item-tierlist": dict(kind="装备", stat=("140", "件全评"), icons=[("item", "死亡之刃"), ("item", "蓝霸符"), ("item", "石像鬼石板甲")], hook="闭眼拿的还是陷阱装"),
    "s18-fairy-refresh": dict(kind="机制", stat=("S18", "仙灵刷新"), icons=[], hook="自然仙灵怎么刷、何时刷"),
    "s18-econ-timing": dict(kind="经济", stat=("10", "金利息线"), icons=[("aug", "高级贷款"), ("aug", "大百宝袋")], hook="什么时候花钱，什么时候憋"),
    "crash-comp-transform": dict(kind="运营", stat=("<30", "血止损"), icons=[], hook="开局崩了怎么救，别硬追原阵容"),
    "level8-vs-9": dict(kind="经济", stat=("8", "还是 9"), icons=[("aug", "高级贷款+")], hook="多上人口 vs 多 D 一轮"),
    "when-to-reroll": dict(kind="运营", stat=("4-2", "分水岭"), icons=[], hook="卡利息慢 D 还是血量告急速 D"),
    # ---------- 新 15 篇 ----------
    "item-component-priority": dict(kind="装备", stat=("4", "类关键散件"), icons=[("item", "反曲之弓"), ("item", "锁子甲"), ("item", "巨人腰带")], hook="散件是期权，别急着行权"),
    "eco-augment-value": dict(kind="经济", stat=("8", "枚经济符文"), icons=[("aug", "珍藏财宝 III"), ("aug", "高级贷款"), ("aug", "大百宝袋")], hook="实际收益远高于你的直觉"),
    "lose-streak-econ": dict(kind="经济", stat=("5", "连败阈值"), icons=[("aug", "高级贷款"), ("aug", "生日礼物")], hook="什么时候该主动卖血"),
    "carousel-priority": dict(kind="运营", stat=("3", "档拿取顺序"), icons=[("item", "反曲之弓"), ("item", "巨人腰带")], hook="散件、金币、棋子先拿哪个"),
    "global-vs-cn-traps": dict(kind="机制", stat=("国服", "口径为准"), icons=[], hook="照搬全球服攻略会踩的坑"),
    "item-crit-system": dict(kind="装备", stat=("3", "件套质变"), icons=[("item", "死亡之刃"), ("item", "最后的轻语"), ("item", "巨人杀手")], hook="物理主 C 三件核心装怎么选"),
    "item-ap-system": dict(kind="装备", stat=("3", "件成型"), icons=[("item", "灭世者的死亡之帽"), ("item", "蓝霸符"), ("item", "莫雷洛秘典")], hook="法强、回蓝、重伤缺一不可"),
    "item-tank-system": dict(kind="装备", stat=("3", "件撑住"), icons=[("item", "石像鬼石板甲"), ("item", "狂徒铠甲"), ("item", "棘刺背心")], hook="护甲、魔抗、血量按对手选"),
    "item-mana-system": dict(kind="装备", stat=("2", "回合内开大"), icons=[("item", "蓝霸符"), ("item", "朔极之矛"), ("item", "大天使之杖")], hook="技能开不出来的主 C 都是废的"),
    # items.json 只有「成装」「纹章」两类、无神器分类，故不硬凑装备图标，回落几何符号
    "item-artifacts": dict(kind="装备", stat=("顶配", "不可强求"), icons=[], hook="神器很强，但别当规划根基"),
    "champ-carry-item": dict(kind="弈子", stat=("2", "件算及格"), icons=[("champ", "德莱文"), ("champ", "厄斐琉斯"), ("champ", "阿狸")], hook="三大主 C 的装备及格线"),
    "champ-frontline": dict(kind="弈子", stat=("3", "条站位原则"), icons=[("champ", "蕾欧娜"), ("champ", "墨菲特"), ("champ", "瑟庄妮")], hook="谁站第一排，谁缩后面"),
    "item-counter": dict(kind="装备", stat=("3", "类反制装"), icons=[("item", "最后的轻语"), ("item", "莫雷洛秘典"), ("item", "棘刺背心")], hook="对手出什么，你就该出什么"),
    "trait-item-synergy": dict(kind="机制", stat=("羁绊", "决定装备"), icons=[("item", "法师纹章"), ("item", "神谕纹章"), ("item", "绝命花妖纹章")], hook="同羁绊，装备优先级完全不同"),
    "item-recipe-gamble": dict(kind="装备", stat=("稳", "字当头"), icons=[("item", "窃贼手套"), ("item", "锁子甲"), ("item", "反曲之弓")], hook="赌纹章/神器是增益不是根基"),
}


def js_cover(c):
    parts = ["kind: '%s'" % c["kind"]]
    parts.append("stat: { v: '%s', k: '%s' }" % (c["stat"][0], c["stat"][1]))
    if c["icons"]:
        ics = ", ".join("{ t: '%s', n: '%s' }" % (t, n) for t, n in c["icons"])
        parts.append("icons: [%s]" % ics)
    if c.get("hook"):
        parts.append("hook: '%s'" % c["hook"])
    return "cover: { %s }," % ", ".join(parts)


def main():
    src = io.open(PATH, encoding="utf-8").read()
    inserted, skipped = [], []

    for slug, c in COVERS.items():
        # 两种写法都要覆盖：原 9 篇 slug: 'x'；新 15 篇 "slug": "x"
        pats = [
            re.compile(r"^(\s*)slug:\s*'%s'," % re.escape(slug), re.M),
            re.compile(r'^(\s*)"slug":\s*"%s",' % re.escape(slug), re.M),
        ]
        hit = None
        for p in pats:
            m = p.search(src)
            if m:
                hit = m
                break
        if not hit:
            skipped.append(slug)
            continue
        # 幂等：该 slug 之后若已有 cover: 就跳过
        tail = src[hit.end():hit.end() + 400]
        if re.search(r"^\s*cover:", tail, re.M):
            skipped.append(slug + "(已有)")
            continue
        indent = hit.group(1)
        newline = "%s\n%s%s" % (hit.group(0), indent, js_cover(c))
        src = src[:hit.start()] + newline + src[hit.end():]
        inserted.append(slug)

    io.open(PATH, "w", encoding="utf-8", newline="").write(src)
    print("已注入 cover: %d 篇" % len(inserted))
    print("跳过: %s" % (", ".join(skipped) if skipped else "无"))
    print("guides.js 现约 %d 字符" % len(src))


if __name__ == "__main__":
    main()
