# 攻略分类方案（共 44 篇）

> 背景：`/guides` 当前 44 篇平铺，用户反馈「太多、不好浏览」。本文件给出三套分类规则供选择。
> 状态：**仅设计，未改动任何代码**。确认方案后再落地。

## 数据基线

- 总数：44
- 原生 `cover.kind` 分布：弈子 17 / 装备 10 / 机制 8 / 经济 4 / 运营 5
- 已为每篇提取 `kind` + `tags`，作为分类依据（下方逐类清单为实测结果）。

---

## 方案 A（推荐）：六维玩法分类

按「读者想解决什么问题」分 6 类，桶最均衡、语义最清晰、找文最准。

| 分类 | 篇数 | 内容定位 |
|---|---|---|
| 阵容攻略 | 13 | 11 套阵容深挖 + 2 张强度榜 |
| 装备体系 | 11 | 装备机制 / 出装 / 神器 / 克制 |
| 版本机制 | 7 | 变形术 / 海克斯矩阵 / 仙灵刷新 / 国服差异 / 羁绊联动 / 强化档位 |
| 运营经济 | 6 | 节奏 / 转型 / 8-9 人口 / 抽卡 / 连败 / 选秀 |
| 对局技巧 | 6 | 前排 / 4 条主 C 操作路线 / 站位大师 |
| 新手入门 | 1 | S18 新手教程 |

**逐篇清单（slug）**
- 阵容攻略 (13)：`comp-kayle-eclipse` `comp-riftbeast-pebbles` `comp-elderwood-aphelios` `comp-reload-hunter-caitlyn` `comp-elderwood-draven` `comp-blossom-ahri` `comp-adaptor-masteryi` `comp-beast-duo` `comp-reload-diana` `comp-defender-cassiopeia` `comp-verdict-zyra` `s18-comp-tierlist` `s18-trait-tierlist`
- 装备体系 (11)：`item-synergy` `item-tierlist` `item-component-priority` `item-crit-system` `item-ap-system` `item-tank-system` `item-mana-system` `item-artifacts` `champ-carry-item` `item-counter` `item-recipe-gamble`
- 版本机制 (7)：`high-transmute` `rune-comp-matrix` `s18-fairy-refresh` `eco-augment-value` `global-vs-cn-traps` `trait-item-synergy` `s18-augment-tierlist`
- 运营经济 (6)：`s18-econ-timing` `crash-comp-transform` `level8-vs-9` `when-to-reroll` `lose-streak-econ` `carousel-priority`
- 对局技巧 (6)：`champ-frontline` `draven-operation-route` `aphelios-operation-route` `ahri-operation-route` `leona-operation-route` `positioning-master`
- 新手入门 (1)：`s18-beginner`

**优点**：分类语义贴合玩家真实决策路径；每类规模适中（最大 13，最小 1）。
**缺点**：需为 44 篇逐一补 `category` 字段（纯数据补录，无逻辑风险）。

---

## 方案 B：原生五类直改名

沿用现有 5 个 `cover.kind` 桶，仅改中文显示名 + UI 配色映射。**零数据改动**。

| 显示名 | 原生 kind | 篇数 |
|---|---|---|
| 角色与阵容 | 弈子 | 17 |
| 装备体系 | 装备 | 10 |
| 版本机制 | 机制 | 8（含新手教程） |
| 经济管理 | 经济 | 4 |
| 运营节奏 | 运营 | 5 |

**优点**：改动最小（只动 `app/guides/page.js` 的显示层 + 配色字典），不碰数据。
**缺点**：
- 经济(4) 与运营(5) 被拆成两类，玩家常把它们当一回事，浏览时要在两处找；
- 新手教程混在「版本机制」里，新手不易发现；
- 阵容推荐被拆到「角色与阵容(11 套)+版本机制(2 张榜)」两处，榜和阵容分离。

---

## 方案 C：阅读路径五类（更粗、翻页更少）

按「从入门到精通」的阅读路径聚合，桶更少、单类更大、翻页更少。

| 分类 | 篇数 | 内容定位 |
|---|---|---|
| 新手入门 | 1 | S18 新手教程 |
| 阵容推荐 | 13 | 11 套阵容 + 2 张榜 |
| 装备出装 | 11 | 装备体系全集 |
| 运营经济 | 8 | 经济 4 + 运营 4 + 强化档位（把 `eco-augment-value`、`s18-augment-tierlist` 并入运营） |
| 版本机制与实战 | 11 | 版本机制 5 + 对局技巧 6（操作路线 / 前排 / 站位） |

**逐篇清单（slug）**
- 新手入门 (1)：`s18-beginner`
- 阵容推荐 (13)：同方案 A 阵容攻略 13 篇
- 装备出装 (11)：同方案 A 装备体系 11 篇
- 运营经济 (8)：`s18-econ-timing` `crash-comp-transform` `level8-vs-9` `when-to-reroll` `lose-streak-econ` `carousel-priority` `eco-augment-value` `s18-augment-tierlist`
- 版本机制与实战 (11)：`high-transmute` `rune-comp-matrix` `s18-fairy-refresh` `global-vs-cn-traps` `trait-item-synergy` `champ-frontline` `draven-operation-route` `aphelios-operation-route` `ahri-operation-route` `leona-operation-route` `positioning-master`

**优点**：桶更少（5 类），适合「不想细分、快点找到大方向」的读者。
**缺点**：最大类 13、次大 11，仍偏大；「版本机制」与「对局技巧」合并后语义略杂。

---

## 落地方式（三方案通用，风险低）

1. **补字段**：为每篇 guide 对象加 `category`（`content/guides.js` 28 篇 + `content/guides_wave1.js` 16 篇）。
2. **改 UI**：`app/guides/page.js` 顶部增加分类页签（「全部」+ 各分类），前端按 `category` 过滤；「当前 N 篇」计数随筛选实时变化。
3. **不动路由 / 数据源**：`category` 纯展示元数据，URL、SEO、sitemap 不受影响。
4. **重建 + 部署**：`next build` → `sudo bash /tmp/deploy-selfhosted-server.sh <tar>` → 外网验证分类页签与计数。

预估改动：约 2 个文件，纯前端 + 数据补字段，无后端逻辑风险。

---

## 推荐与默认

- **推荐方案 A**：语义最清晰、规模最均衡，最贴合「方便查看」的诉求。
- 默认按 A 执行；你回复 **A / B / C** 或提出修改后，我再落地。
- 当前仅交付本方案，**未改动任何代码与数据**。
