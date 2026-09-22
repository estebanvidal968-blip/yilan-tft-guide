/**
 * 英雄联盟传奇 · 海克斯典籍（S16.5）— 城邦钥匙数据
 *
 * 机制：每个城邦类羁绊对应两把钥匙
 *   - 秩序钥匙（蓝）：前期解锁，滚雪球用
 *   - 科技钥匙（金）：后期质变，通常要求「三星 + 10 级」
 *
 * ⚠️ 数据来源：官方前瞻 + 公开攻略整理（部分为测试服数据），
 *    实际解锁条件与数值以游戏内为准。审核时请重点核对 cond / effect 两列。
 */

export const KEY_TYPES = {
  order: { label: '秩序钥匙', tone: 'order' },
  tech: { label: '科技钥匙', tone: 'tech' },
};

// 城邦钥匙全览。tone: order=秩序(蓝) / tech=科技(金)
export const cityKeys = [
  {
    city: '巨神峰',
    alias: 'Targon',
    unlock: '队伍规模 +1，前期抢节奏利器',
    keys: [
      {
        type: 'order',
        cond: '登场 1 个三星巨神峰弈子',
        attr: '+300 生命值 · +40 法术强度 · 3 法力回复',
        effect: '你的队伍获得 +1 最大队伍规模',
      },
      {
        type: 'tech',
        cond: '3 个三星巨神峰弈子 + 升到 10 级',
        attr: '—',
        effect: '全队 10 秒免伤，结束后流星造成高额伤害',
      },
    ],
  },
  {
    city: '比尔吉沃特',
    alias: 'Bilgewater',
    unlock: '银蛇币经济流，越买越富',
    keys: [
      {
        type: 'order',
        cond: '在比尔吉沃特商店中累计购买弈子 12 次（另有资料记为 20 次，以游戏内为准）',
        attr: '+300 生命值 · 30% 攻击速度 · 50% 暴击率',
        effect: '银蛇币收入增加 50% · 普通商店更可能包含比尔吉沃特弈子',
      },
      {
        type: 'tech',
        cond: '3 个三星比尔吉沃特英雄 + 10 级',
        attr: '—',
        effect: '商店刷新免费 · 每次击杀获得金币',
      },
    ],
  },
  {
    city: '艾欧尼亚',
    alias: 'Ionia',
    unlock: '击杀掉散件，装备白嫖流',
    keys: [
      {
        type: 'order',
        cond: '上场 8 个艾欧尼亚英雄',
        attr: '+20 物理/法术加成 · +20 护甲/魔抗 · 20% 暴击率 · 2 法力回复',
        effect: '赋予佩戴者艾欧尼亚羁绊 · 每 10 次击杀后获得 1 个随机装备组件',
      },
      {
        type: 'tech',
        cond: '累计 21 星艾欧尼亚英雄 + 10 级（约 7 个三星，五套钥匙中难度最高）',
        attr: '—',
        effect: '开局给最强 5 人创造影分身，复制其属性与装备',
      },
    ],
  },
  {
    city: '弗雷尔卓德',
    alias: 'Freljord',
    unlock: '自带炮台补伤害，星级是硬指标',
    keys: [
      {
        type: 'order',
        cond: '登场 11 星级的弗雷尔卓德弈子',
        attr: '+300 生命值 · 10% 伤害增幅 · 10% 减伤',
        effect: '弗雷尔卓德防御塔每 3 秒发射一次远程射击，造成魔法伤害',
      },
      {
        type: 'tech',
        cond: '累计 16 星弗雷尔卓德英雄 + 10 级',
        attr: '—',
        effect: '（待游戏内确认）星级门槛提升后的强化版本',
      },
    ],
  },
  {
    city: '暗影岛',
    alias: 'Shadow Isles',
    unlock: '战斗灵魂体系，残局保底金币',
    keys: [
      {
        type: 'order',
        cond: '累计登场 8 星',
        attr: '—',
        effect: '增加战斗灵魂获取 · 残局直接给 15 金币',
      },
      {
        type: 'tech',
        cond: '累计 12 星 + 10 级',
        attr: '—',
        effect: '开战永久冻结敌方全场，并每秒扣除生命值',
      },
    ],
  },
  {
    city: '以绪塔尔',
    alias: 'Ixtal',
    unlock: '阳光碎片收益 + 锁血保命',
    keys: [
      {
        type: 'order',
        cond: '三星奇亚娜 + 完成 3 个任务',
        attr: '—',
        effect: '阳光碎片收益 +50% · 击杀返金',
      },
      {
        type: 'tech',
        cond: '累计 14 星 + 9 级',
        attr: '—',
        effect: '每局结算 400 阳光 · 淘汰时强制锁 1 血并回血',
      },
    ],
  },
  {
    city: '诺克萨斯',
    alias: 'Noxus',
    unlock: '厄塔汗击杀成长体系',
    keys: [
      {
        type: 'order',
        cond: '厄塔汗获得 20 次击杀 + 7 级',
        attr: '—',
        effect: '厄塔汗可吃佩戴者双攻加成',
      },
      {
        type: 'tech',
        cond: '厄塔汗 100 次击杀 + 10 级',
        attr: '—',
        effect: '为存活的队友提供免伤与 50% 增伤',
      },
    ],
  },
  {
    city: '虚空',
    alias: 'Void',
    unlock: '突变流，需持续开羁绊',
    keys: [
      {
        type: 'order',
        cond: '登场使用虚空羁绊持续 12 回合',
        attr: '+400 生命值 · 20 护甲/魔抗 · 4 法力回复',
        effect: '赋予佩戴者虚空羁绊 · 虚空羁绊激活时额外获得 3 个突变',
      },
    ],
  },
  {
    city: '祖安',
    alias: 'Zaun',
    unlock: '微光融合体系，需持续开羁绊',
    keys: [
      {
        type: 'order',
        cond: '登场使用祖安羁绊持续 12 回合',
        attr: '+400 生命值 · 15% 伤害增幅 · 15% 耐久',
        effect: '赋予佩戴者祖安羁绊 · 祖安单位微光融合频率提高 1 秒',
      },
    ],
  },
  {
    city: '约德尔',
    alias: 'Bandle City',
    unlock: '低费好追三，三星数量是门槛',
    keys: [
      {
        type: 'order',
        cond: '同时登场 3 个三星约德尔人',
        attr: '—',
        effect: '（待游戏内确认）',
      },
      {
        type: 'tech',
        cond: '同时登场 7 个三星约德尔人 + 升到 10 级',
        attr: '—',
        effect: '（待游戏内确认）大后期终极目标',
      },
    ],
  },
  {
    city: '德玛西亚',
    alias: 'Demacia',
    unlock: '装备数量 / 加里奥击杀',
    keys: [
      {
        type: 'order',
        cond: '在一个三星德玛西亚英雄身上装备 3 件装备',
        attr: '—',
        effect: '（待游戏内确认）',
      },
      {
        type: 'tech',
        cond: '加里奥获得 20 次击杀 + 10 级',
        attr: '—',
        effect: '（待游戏内确认）',
      },
    ],
  },
];

export const totalKeys = cityKeys.reduce((n, c) => n + c.keys.length, 0);
