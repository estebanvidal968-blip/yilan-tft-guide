// AI 文案生成层（金铲铲阵容点评 / 符文指引 / 选子技巧）。
// 鉴权按优先级自动选择（OpenAI 兼容优先，其次腾讯混元 TC3 直连）：
//
//   ① OpenAI 兼容（provider 无关，Bearer Token，sk- 开头）—— 任意兼容 /v1/chat/completions 的厂商
//      LLM_API_KEY    -> Authorization: Bearer <token>
//      LLM_BASE_URL   -> 默认智谱 https://open.bigmodel.cn/api/paas/v4
//      LLM_MODEL      -> 默认 glm-4-flash（免费档；可换 glm-4-plus / glm-4-air）
//      换厂商只改这三个变量，代码零改：
//        腾讯混元官方 : LLM_BASE_URL=https://api.hunyuan.cloud.tencent.com/v1  LLM_MODEL=hy4-preview
//        DeepSeek     : LLM_BASE_URL=https://api.deepseek.com/v1              LLM_MODEL=deepseek-chat
//        Kimi(月之暗面): LLM_BASE_URL=https://api.moonshot.cn/v1              LLM_MODEL=moonshot-v1-8k
//        通义 Qwen    : LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1  LLM_MODEL=qwen-plus
//   ② 腾讯云 TC3-HMAC-SHA256 直连（原生 SDK 方式，仅腾讯混元）
//      HUNYUAN_SECRET_ID / HUNYUAN_SECRET_KEY / HUNYUAN_MODEL（默认 hunyuan-pro）
//
// 所有密钥只来自服务端环境变量，前端绝不接触。
// 缺密钥 / 调用失败时，降级为基于 stat 的模板评语，保证同步流水线可跑通。

import crypto from 'node:crypto';

// ---------- TC3 直连（腾讯云原生签名） ----------
const HOST = 'hunyuan.tencentcloudapi.com';
const SERVICE = 'hunyuan';
const REGION = 'ap-guangzhou';
const ACTION = 'ChatCompletions';
const VERSION = '2023-09-01';

function sha256(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}
function hmac(secret, data) {
  return crypto.createHmac('sha256', secret).update(data, 'utf8').digest();
}

// 腾讯云 TC3 签名：https://cloud.tencent.com/document/api/1729/104753
function buildAuth(secretId, secretKey, payload) {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  const hashedPayload = sha256(payload);
  const canonicalHeaders = `content-type:application/json\nhost:${HOST}\n`;
  const signedHeaders = 'content-type;host';
  const canonicalRequest = [
    'POST',
    '/',
    '',
    canonicalHeaders,
    signedHeaders,
    hashedPayload,
  ].join('\n');

  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const stringToSign = [
    'TC3-HMAC-SHA256',
    timestamp,
    credentialScope,
    sha256(canonicalRequest),
  ].join('\n');

  const secretDate = hmac(`TC3${secretKey}`, date);
  const secretService = hmac(secretDate, SERVICE);
  const secretSigning = hmac(secretService, 'tc3_request');
  const signature = hmac(secretSigning, stringToSign).toString('hex');

  const authorization =
    `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { authorization, timestamp };
}

// ---------- OpenAI 兼容（Bearer Token，provider 无关） ----------
function getLLMConfig() {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    baseURL: (process.env.LLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/+$/, ''),
    model: process.env.LLM_MODEL || 'glm-4-flash',
  };
}

// 带超时的 fetch 信号：单个 LLM 调用最长 60s（glm-5 跨境链路首字 ~18s，25s 太紧会误杀）。
function withTimeout(ms = 60000) {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), ms);
  return { signal: ac.signal, clear: () => clearTimeout(id) };
}

// 走 OpenAI 兼容 /v1/chat/completions。成功返回文本，失败抛出异常。
async function callLLM(prompt) {
  const cfg = getLLMConfig();
  if (!cfg) return null;
  const to = withTimeout(60000); // 单个 LLM 调用最长 60s
  try {
    const resp = await fetch(`${cfg.baseURL}/chat/completions`, {
      method: 'POST',
      signal: to.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    });
    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      throw new Error(`HTTP ${resp.status} ${txt.slice(0, 200)}`);
    }
    const json = await resp.json();
    const text = json?.choices?.[0]?.message?.content;
    return text ? text.trim() : null;
  } finally {
    to.clear();
  }
}

// 走腾讯云 TC3 原生 ChatCompletions。成功返回文本，失败抛出异常或返回 null。
async function callTC3(prompt, model) {
  const id = process.env.HUNYUAN_SECRET_ID;
  const key = process.env.HUNYUAN_SECRET_KEY;
  if (!id || !key) return null;

  const payload = JSON.stringify({
    Model: model,
    Messages: [{ Role: 'user', Content: prompt }],
  });
  const { authorization, timestamp } = buildAuth(id, key, payload);
  const to = withTimeout(60000); // 单个 TC3 调用最长 60s
  try {
    const resp = await fetch(`https://${HOST}/`, {
      method: 'POST',
      signal: to.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
        'X-TC-Action': ACTION,
        'X-TC-Version': VERSION,
        'X-TC-Region': REGION,
        'X-TC-Timestamp': String(timestamp),
      },
      body: payload,
    });
    const json = await resp.json();
    const text = json?.Response?.Choices?.[0]?.Message?.Content;
    return text ? text.trim() : null;
  } finally {
    to.clear();
  }
}

// 统一入口：OpenAI 兼容（LLM_*）优先，其次 TC3，再交给调用方降级模板。
async function callHunyuan(prompt) {
  // ① OpenAI 兼容（Bearer，任意厂商）
  try {
    const t = await callLLM(prompt);
    if (t) return t;
  } catch (e) {
    console.warn('[hunyuan] OpenAI 兼容调用失败，尝试 TC3：', e.message);
  }
  // ② TC3 直连
  const tc3Model = process.env.HUNYUAN_MODEL || 'hunyuan-pro';
  try {
    const t = await callTC3(prompt, tc3Model);
    if (t) return t;
  } catch (e) {
    console.warn('[hunyuan] TC3 调用失败：', e.message);
  }
  return null;
}

function fallbackComment(comp) {
  const core = (comp.positions || []).filter((p) => p.carry).map((p) => p.champ);
  const traits = (comp.traits || []).slice(0, 3).join('、');
  const s = comp.stat || {};
  const stats = [
    s.top4Rate && `前四率 ${(s.top4Rate * 100).toFixed(1)}%`,
    s.avgPlacement && `平均排名 ${s.avgPlacement}`,
    s.winRate && `胜率 ${(s.winRate * 100).toFixed(1)}%`,
  ].filter(Boolean).join('，');
  return `以${core.join('、') || '核心棋子'}为核心的${traits}体系（${comp.tier}）。${stats}${stats ? '。' : ''}数据为 OP.GG 实时统计，具体运营请见站位与装备建议。`;
}

export async function generateComment(comp) {
  const core = (comp.positions || [])
    .filter((p) => p.carry)
    .map((p) => `${p.champ}（核心装备：${(p.items || []).join('、') || '无'}）`);
  const traits = (comp.traits || []).join('、');
  const s = comp.stat || {};
  const stats = [
    s.avgPlacement && `平均排名 ${s.avgPlacement}`,
    s.top4Rate && `前四率 ${(s.top4Rate * 100).toFixed(1)}%`,
    s.winRate && `胜率 ${(s.winRate * 100).toFixed(1)}%`,
    s.pickRate && `选取率 ${(s.pickRate * 100).toFixed(1)}%`,
  ]
    .filter(Boolean)
    .join('，');

  const prompt =
    `你是金铲铲之战攻略作者。用一句人话（不超过 60 字）点评下面这套阵容，` +
    `说清它为什么强 / 怎么运营 / 怕什么。不要列条目，不要 Markdown。\n` +
    `阵容：${comp.name}\n` +
    `核心棋子与装备：${core.join('；') || '—'}\n` +
    `羁绊：${traits}\n` +
    `实时数据：${stats || '—'}`;

  const text = await callHunyuan(prompt);
  return text || fallbackComment(comp);
}

function fallbackRuneGuide(comp) {
  const traits = (comp.traits || []).slice(0, 3);
  const lead = traits[0] || '本体系';
  const core =
    (comp.coreChampions && comp.coreChampions[0]) ||
    (comp.positions || []).find((p) => p.carry)?.champ ||
    '核心C位';
  return `看到${traits.join('、') || '体系'}来牌顺、或野怪爆了${core}的散件时就该冲这套。强化符文优先拿${lead}相关的战力 / 转职类；前期经济顺可拿利滚利类存钱，3-2 或 4-2 再补战力海克斯。`;
}

// 阵容选取思路 + 强化符文搭配（金铲铲 S18 自然之力）。
export async function generateRuneGuide(comp) {
  const traits = (comp.traits || []).join('、');
  const core = (
    comp.coreChampions ||
    (comp.positions || []).filter((p) => p.carry).map((p) => p.champ)
  ).join('、');
  const prompt =
    `你是金铲铲之战 S18「自然之力」攻略作者。针对下面这套阵容，用 2-3 句人话说明：` +
    `①什么情况下该选这套（看什么来牌 / 装备 / 海克斯信号）；②强化符文怎么搭配（推荐哪类符文，战力 / 经济 / 转职）。` +
    `不要列条目、不要 Markdown，控制在 130 字内。\n` +
    `阵容：${comp.name}\n核心棋子：${core || '—'}\n羁绊：${traits}`;

  const text = await callHunyuan(prompt);
  return text || fallbackRuneGuide(comp);
}

function fallbackPickTips(comp) {
  const carries = (comp.positions || []).filter((p) => p.carry).map((p) => p.champ);
  const core = (comp.coreChampions || []).join('、') || carries.join('、') || '核心C位';
  const front = (comp.positions || [])
    .filter((p) => p.row === 0)
    .map((p) => p.champ)
    .slice(0, 2)
    .join('、');
  const leadTrait = (comp.traits || [])[0] || '';
  return `优先追${carries.join('、') || core}的二星与核心装备；前期用${front || '低费前排'}打工过渡，别硬 D；若${core.split('、')[0]}迟迟不来牌，就转其他${leadTrait}体系保血。`;
}

// 这套阵容选取弈子的小技巧（金铲铲 S18 自然之力）。
export async function generatePickTips(comp) {
  const carries = (comp.positions || []).filter((p) => p.carry).map((p) => p.champ);
  const core = (comp.coreChampions || carries).join('、');
  const traits = (comp.traits || []).join('、');
  const prompt =
    `你是金铲铲之战 S18「自然之力」攻略作者。给下面这套阵容写 2-3 条「选弈子小技巧」：` +
    `优先追哪个弈子的星级 / 装备、什么情况下换替代棋、前期用什么打工。每条短句，不要列编号、不要 Markdown，控制在 130 字内。\n` +
    `阵容：${comp.name}\n核心棋子：${core || '—'}\n羁绊：${traits}`;

  const text = await callHunyuan(prompt);
  return text || fallbackPickTips(comp);
}
