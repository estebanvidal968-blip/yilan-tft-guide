// 中文名映射层：把 OP.GG 的英文 key（如 DA_18_Leona / Draven18 / Maokai_Unique Trait18）
// 清洗并尽量转成可读中文。物品名来自 tft_list_item_combinations 的 ingameKey↔name（运行时注入）；
// 英雄 / 羁绊用基础表 + 强清洗 + 美化回退（去前缀、去 Set 编号、去 _AD/_AP）。

export const CHAMPION_MAP = {
  Leona: '蕾欧娜', Cassiopeia: '卡西奥佩娅', Rammus: '拉姆斯', Fiddlesticks: '费德提克',
  Ornn: '奥恩', Shen: '慎', Lillia: '莉莉娅', Ahri: '阿狸', Syndra: '辛德拉',
  Zoe: '佐伊', Jinx: '金克丝', Caitlyn: '凯特琳', KaiSa: '卡莎',
  Yasuo: '亚索', Yone: '永恩', Fiora: '菲奥娜', Volibear: '沃利贝尔',
  RekSai: '雷克塞', Taric: '塔里克', Lulu: '璐璐', Jhin: '烬',
  Ekko: '艾克', Kayn: '凯隐', Akali: '阿卡丽', Katarina: '卡特琳娜',
  Vi: '蔚', Aatrox: '亚托克斯', Tristana: '崔丝塔娜', Sejuani: '瑟庄妮',
  Braum: '布隆', Nasus: '内瑟斯', Sion: '赛恩', Ashe: '艾希',
  Zed: '劫', Pyke: '派克', Talon: '泰隆', Soraka: '索拉卡',
  Sivir: '希维尔', Karma: '卡尔玛', Zyra: '婕拉', Sett: '瑟提',
  Yorick: '约里克', Ivern: '艾翁', Kennen: '凯南', Alistar: '阿利斯塔',
  Ezreal: '伊泽瑞尔', Draven: '德莱文', Maokai: '茂凯', Gnar: '纳尔',
  Amumu: '阿木木', KogMaw: '克格莫', Nidalee: '奈德丽', MasterYi: '易',
  Gwen: '格温', Viego: '薇古丝', Aphelios: '厄斐琉斯', Nilah: '妮菈',
  Samira: '莎弥拉', Seraphine: '萨勒芬妮', Senna: '赛娜', Thresh: '锤石',
  Janna: '迦娜', Lux: '拉克丝', Morgana: '莫甘娜', Brand: '布兰德',
  Teemo: '提莫', Gragas: '古拉加斯', ChoGath: '科加斯', Veigar: '维迦',
  TwistedFate: '崔斯特', Gangplank: '普朗克', MissFortune: '厄运小姐',
  Riven: '锐雯', Quinn: '奎因', Kindred: '千珏',   Zeri: '泽丽',
  // 数据中出现但未映射的真实英雄（补充以提高头像覆盖率）
  Elise: '伊莉丝', Diana: '黛安娜', Rakan: '洛', Hecarim: '赫卡里姆', Leblanc: '乐芙兰',
};

const TRAIT_MAP = {
  Defender: '护卫', Spellweaver: '咒术师', Coven: '魔女', Solar: '圣盾', Fae: '仙灵',
  Elderwood: '幽林', Inferno: '炼狱', Executioner: '处刑人', Sprykin: '灵狐',
  FloraFatalis: '花灵', Bruiser: '斗士', Sniper: '狙神', Juggernaut: '重装战士',
  Duelist: '决斗大师', Blademaster: '剑士', Mage: '法师', Guardian: '秘术卫士',
  Warden: '守护者', Assassin: '刺客', SourcePlan: '源计划', Hacker: '黑客',
  StarGuardian: '星之守护者',   Blossom: '花绽', Brawler: '格斗家', Adaptor: '适应体',
  Caustic: '腐蚀', Emerald: '翡翠', Greenfather: '绿父亲', Hunter: '猎手',
  Invoker: '召唤师', Frost: '冰霜', Dusk: '暮色', Sureshot: '神射手',
  Mascot: '吉祥物', Revolution: '革命', Aegis: '圣盾使', RapidFire: '速射',
  Primal: '原始', Riftbeast: '裂隙兽', Vanguard: '先锋', Lunar: '月相',
  Slayer: '杀手', Blackthorn: '黑荆棘', Sentinel: '哨兵', ApexPredator: '顶级掠食者',
  Summoner: '召唤师',
};

export const CHAMPION_EXTRA = {
  Alune: '阿露恩', Xayah: '霞', Kayle: '凯尔',
};

// 金铲铲 S18「自然之力」独占单位：峡谷野怪（石甲虫 / 魔沼蛙 / 远古巨龙等）。
// 全球 TFT 数据里它们以 PVE 野怪 key（DA_18_Sentry / DA_Murkwolf18 / DA_18_ElderDragon…）出现，
// 但在金铲铲 S18 中是可上场的真单位（远古巨龙为 7 费双人口高费弈子）。
// key 为 cleanKey 后的结果；费用按金铲铲 S18 实测定位。
export const JCC_UNITS = {
  Sentry: { name: '石甲虫', cost: 1 },
  Murkwolf: { name: '魔沼蛙', cost: 1 },
  Krug: { name: '石甲虫', cost: 1 },
  Brambleback: { name: '石甲虫', cost: 1 },
  Sentinel: { name: '锋喙鸟', cost: 1 },
  ElderDragon: { name: '远古巨龙', cost: 7 },
};

// 真实英雄 key 全集（基础表 + 扩展表），用于区分「真实英雄」与「PVE 野怪」。
const REAL_CHAMP_KEYS = new Set([...Object.keys(CHAMPION_MAP), ...Object.keys(CHAMPION_EXTRA)]);

// 判定 OP.GG 的 unit.key 是否为可上场单位（真实英雄 或 金铲铲独占野怪单位）。
// 野怪 key 形如 DA_18_Sentry / DA_Murkwolf18 / DA_18_ElderDragon，清洗后在 JCC_UNITS 内能命中；
// 真实英雄（含 Taric、Gnar 等）则能命中英雄表。
export function isChampionKey(key) {
  if (!key) return false;
  const raw = cleanKey(key);
  const cands = new Set([raw, raw.replace(/\d+$/, '')]);
  const base = raw.replace(/(Small|Big|Large)$/i, '').trim(); // GnarSmall → Gnar
  cands.add(base);
  cands.add(base.replace(/\d+$/, ''));
  for (const c of cands) {
    if (REAL_CHAMP_KEYS.has(c)) return true;
    if (JCC_UNITS[c]) return true; // 金铲铲 峡谷野怪单位
  }
  return false;
}

let ITEM_MAP = {};

export function setItemMap(map) {
  ITEM_MAP = map || {};
}

// 强清洗：剥离 DA_18_ / TFT18_ 前缀、尾部 _18 编号、_AD/_AP/_Unique 后缀、Trait 词、下划线。
function cleanKey(key) {
  return key
    .replace(/^DA_(\d+_)?/, '')
    .replace(/^TFT(\d+)?_/, '')
    .replace(/_\d+$/, '')
    .replace(/_(AD|AP|Unique)$/i, '')
    .replace(/Trait/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function niceCase(s) {
  return s.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

// 英雄专属羁绊：key 形如 "DA_18_Zyra_Unique Trait" / "Maokai_Unique Trait18"
function maybeUniqueTrait(key) {
  if (!/unique/i.test(key)) return null;
  let s = key.replace(/^DA_(\d+_)?/, '').replace(/^TFT(\d+)?_/, '');
  s = s.split(/unique/i)[0].replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  const cn = translateChamp(s);
  return `${cn} 专属`;
}

function normAlpha(s) {
  return s.replace(/^DA_/, '').replace(/[^a-zA-Z]/g, '');
}

// 金铲铲独占单位的费用（cleanKey 后在 JCC_UNITS 命中则返回，否则 null）。
export function jccCost(key) {
  if (!key) return null;
  const raw = cleanKey(key);
  const cands = [raw, raw.replace(/\d+$/, ''), raw.replace(/(Small|Big|Large)$/i, '').trim(), raw.replace(/(Small|Big|Large)\d*$/i, '').trim().replace(/\d+$/, '')];
  for (const c of cands) if (JCC_UNITS[c]) return JCC_UNITS[c].cost;
  return null;
}

export function translateChamp(key) {
  const raw = cleanKey(key);
  // 金铲铲 S18 独占单位（峡谷野怪）优先
  const jccCands = [raw, raw.replace(/\d+$/, ''), raw.replace(/(Small|Big|Large)$/i, '').trim(), raw.replace(/(Small|Big|Large)\d*$/i, '').trim().replace(/\d+$/, '')];
  for (const c of jccCands) if (JCC_UNITS[c]) return JCC_UNITS[c].name;
  const lookup = (s) =>
    CHAMPION_MAP[s] ||
    CHAMPION_EXTRA[s] ||
    CHAMPION_MAP[s.replace(/\d+$/, '')] ||
    CHAMPION_EXTRA[s.replace(/\d+$/, '')];
  // 剥离 Small/Big/Large 形态后缀（如 GnarSmall → Gnar，认出真实英雄）
  const base = raw.replace(/(Small|Big|Large)$/i, '').trim();
  return (
    lookup(raw) ||
    lookup(base) ||
    CHAMPION_MAP[raw.replace(/\s/g, '')] ||
    CHAMPION_EXTRA[raw.replace(/\s/g, '')] ||
    niceCase(raw)
  );
}

export function translateTrait(key) {
  const uniq = maybeUniqueTrait(key);
  if (uniq) return uniq;
  const raw = cleanKey(key);
  if (TRAIT_MAP[raw]) return TRAIT_MAP[raw];
  const noNum = raw.replace(/\d+$/, '');
  if (TRAIT_MAP[noNum]) return TRAIT_MAP[noNum];
  return TRAIT_MAP[raw.replace(/\s/g, '')] || niceCase(raw);
}

export function translateItem(key) {
  if (ITEM_MAP[key]) return ITEM_MAP[key];
  const cleaned = cleanKey(key);
  if (ITEM_MAP[cleaned]) return ITEM_MAP[cleaned];
  const norm = normAlpha(key);
  if (ITEM_MAP[norm]) return ITEM_MAP[norm];
  return ITEM_MAP[key.replace(/\d+$/, '')] || niceCase(cleaned);
}
