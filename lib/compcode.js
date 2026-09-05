// 阵容码生成：把一套阵容压成可复制、人读可抄的配置码。
//
// 输出结构：
//   compCode        —— 多行详细版，用于人审 Markdown 与详情页展示
//   compCodeShort   —— 单行紧凑版，用于列表卡"复制阵容配置"
//
// 说明：当前输出「阵容配置码（复制参考）」，玩家可照抄到游戏里摆阵容/合装备。
// 游戏内原生「分享码」需要官方 TFT set 编码器（data-dragon set hash + MID 编码），
// 离线环境暂不具备，列为后续增强项；本模块输出结构已预留可被原生编码器消费的数据，
// 后续接入不影响上层。

// 取核心/有站位单位，避免空数组
function unitsOf(comp) {
  const pos = comp?.positions || [];
  if (pos.length) return pos;
  return comp?.roster || [];
}

export function buildCompCode(comp) {
  const tier = comp?.tier || '?';
  const name = comp?.name || '未命名阵容';
  const traits = (comp?.traits || []).join('·');
  const core = unitsOf(comp).filter((p) => p.carry);
  const coreLine = (core.length ? core : unitsOf(comp))
    .map((p) => `${p.champ}(${(p.items || []).join('+') || '无装备'})`)
    .join(' ');
  const positions = unitsOf(comp)
    .map((p) => `${p.champ}@(${p.row ?? '?'},${p.col ?? '?'})`)
    .join(' ');

  return [
    `【S18自然之力·${name}·${tier}】`,
    `羁绊: ${traits || '—'}`,
    `核心装备: ${coreLine || '—'}`,
    `站位: ${positions || '—'}`,
  ].join('\n');
}

export function buildCompCodeCompact(comp) {
  const name = comp?.name || '未命名阵容';
  const traits = (comp?.traits || []).join('/');
  const core = unitsOf(comp)
    .filter((p) => p.carry)
    .map((p) => p.champ)
    .join('+');
  return `S18·${name}｜${traits}｜核心:${core}｜阵容码见详情`;
}
