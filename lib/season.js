// 当前赛季元信息（唯一真源）。
//
// 赛季名/英文名/核心机制会被首页 hero 与同步脚本共用，集中放在这里，
// 换赛季时只改本文件，不必到 page.js 和 sync-opgg.mjs 里分别改硬编码。
//
// 参考（2026-08-20 上线）：
//   官方赛季名「自然之力」，英文名 Enchanted Wilds（直译「魔法荒野」），
//   主题为森林·魔法·自然；赛季核心机制叫「自然仙灵」——注意不是赛季名。
export const SEASON = {
  no: '18',
  theme: '自然之力',
  themeEn: 'Enchanted Wilds',
  // 赛季核心机制，首页 hero 用它讲清「这个赛季玩的是什么」
  mechanic: {
    name: '自然仙灵',
    desc: '每两次商店刷新，商店右侧会出现一位可购买的「自然仙灵」，200+ 种效果覆盖弈子、战力、金币与经验，是本赛季运营的核心变量。',
  },
};

// 版本列表里的展示名（同步脚本写 versions.opgg.json 用）
export function seasonLabel(patch) {
  return `金铲铲 S${String(patch || SEASON.no).split('.')[0]} ${SEASON.theme}`;
}
