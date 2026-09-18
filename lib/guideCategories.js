// 攻略分类（方案 A：六维玩法分类）—— 唯一真相源。
//
// 不改动 content/guides.js 的 44 个 guide 对象，分类关系集中在此：
//   CATEGORY_ORDER  展示顺序
//   CATEGORY_META   每类的颜色（--cc）与一句话描述
//   CATEGORY_OF     slug → 分类名（覆盖全部 44 篇）
// 列表页 / 详情页统一从此处取分类，避免数据重复维护。
//
// 若新增攻略，只需在 CATEGORY_OF 补一行 slug→分类 即可。

export const CATEGORY_ORDER = [
  '阵容攻略',
  '装备体系',
  '版本机制',
  '运营经济',
  '对局技巧',
  '新手入门',
];

export const CATEGORY_META = {
  阵容攻略: { color: '#ff6b6b', desc: '当前版本强势阵容拆解与强度总榜' },
  装备体系: { color: '#f5a623', desc: '装备机制、出装思路与克制关系' },
  版本机制: { color: '#9b6bff', desc: '自然仙灵、海克斯与版本核心规则' },
  运营经济: { color: '#2ec4b6', desc: '经济运营、节奏与转型决策' },
  对局技巧: { color: '#4d96ff', desc: '主 C 操作路线与站位博弈' },
  新手入门: { color: '#57c84d', desc: '刚入坑必读的基础教程' },
};

export const CATEGORY_OF = {
  // 阵容攻略（13）
  'comp-kayle-eclipse': '阵容攻略',
  'comp-riftbeast-pebbles': '阵容攻略',
  'comp-elderwood-aphelios': '阵容攻略',
  'comp-reload-hunter-caitlyn': '阵容攻略',
  'comp-elderwood-draven': '阵容攻略',
  'comp-blossom-ahri': '阵容攻略',
  'comp-adaptor-masteryi': '阵容攻略',
  'comp-beast-duo': '阵容攻略',
  'comp-reload-diana': '阵容攻略',
  'comp-defender-cassiopeia': '阵容攻略',
  'comp-verdict-zyra': '阵容攻略',
  's18-comp-tierlist': '阵容攻略',
  's18-trait-tierlist': '阵容攻略',

  // 装备体系（11）
  'item-synergy': '装备体系',
  'item-tierlist': '装备体系',
  'item-component-priority': '装备体系',
  'item-crit-system': '装备体系',
  'item-ap-system': '装备体系',
  'item-tank-system': '装备体系',
  'item-mana-system': '装备体系',
  'item-artifacts': '装备体系',
  'champ-carry-item': '装备体系',
  'item-counter': '装备体系',
  'item-recipe-gamble': '装备体系',

  // 版本机制（7）
  'high-transmute': '版本机制',
  'rune-comp-matrix': '版本机制',
  's18-fairy-refresh': '版本机制',
  'eco-augment-value': '版本机制',
  'global-vs-cn-traps': '版本机制',
  'trait-item-synergy': '版本机制',
  's18-augment-tierlist': '版本机制',

  // 运营经济（6）
  's18-econ-timing': '运营经济',
  'crash-comp-transform': '运营经济',
  'level8-vs-9': '运营经济',
  'when-to-reroll': '运营经济',
  'lose-streak-econ': '运营经济',
  'carousel-priority': '运营经济',

  // 对局技巧（6）
  'champ-frontline': '对局技巧',
  'draven-operation-route': '对局技巧',
  'aphelios-operation-route': '对局技巧',
  'ahri-operation-route': '对局技巧',
  'leona-operation-route': '对局技巧',
  'positioning-master': '对局技巧',

  // 新手入门（1）
  's18-beginner': '新手入门',
};

export function categoryOf(slug) {
  return CATEGORY_OF[slug] || '未分类';
}

// 按分类聚合（仅返回有内容的分类，保持 CATEGORY_ORDER 顺序）
export function guidesByCategory(guides) {
  return CATEGORY_ORDER.map((cat) => ({
    cat,
    meta: CATEGORY_META[cat],
    items: guides.filter((g) => categoryOf(g.slug) === cat),
  })).filter((g) => g.items.length > 0);
}
