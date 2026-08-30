// OP.GG 数据层：通过官方 MCP（Streamable HTTP，免鉴权）拉取 TFT 当前版本阵容。
// 仅用于服务端（Next.js API 路由 / 同步脚本），绝不进前端。
import { translateChamp, translateTrait, translateItem, setItemMap, isChampionKey, jccCost } from './riot-names.js';

const MCP = 'https://mcp-api.op.gg/mcp';
const APP = 'application/json, text/event-stream';

function guessSet(patch) {
  // "18.1" -> "set18"
  const m = String(patch).match(/^(\d+)/);
  return m ? `set${m[1]}` : 'set18';
}

export class OpggClient {
  constructor() {
    this.session = null;
    this.headers = { 'Content-Type': 'application/json', Accept: APP };
  }

  async _post(body) {
    const res = await fetch(MCP, { method: 'POST', headers: this.headers, body: JSON.stringify(body) });
    const sid = res.headers.get('mcp-session-id');
    if (sid) this.headers['mcp-session-id'] = sid;
    return res.text();
  }

  async init() {
    await this._post({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'yilan-sync', version: '1.0' } },
    });
    await this._post({ jsonrpc: '2.0', method: 'notifications/initialized' });
  }

  async callTool(name, args = {}) {
    const raw = await this._post({
      jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name, arguments: args },
    });
    const json = JSON.parse(raw);
    const text = json?.result?.content?.[0]?.text;
    if (!text) throw new Error(`OP.GG 工具 ${name} 返回为空`);
    return JSON.parse(text);
  }

  // 物品 ingameKey / apiName / org.key -> 中文名，供装备翻译层使用。
  // 额外按「去 DA_ 前缀、去空格/非字母」归一化建索引，覆盖 unit.items 用的英文展示名。
  async buildItemMap() {
    try {
      const r = await this.callTool('tft_list_item_combinations', { lang: 'zh_CN' });
      const arr = r.data || [];
      const map = {};
      const add = (k, name) => {
        if (!k || !name) return;
        map[k] = name;
        map[k.replace(/^DA_/, '').replace(/[^a-zA-Z]/g, '')] = name; // 归一化
      };
      arr.forEach((it) => {
        add(it.ingameKey, it.name);
        add(it.apiName, it.name);
        add(it?.org?.key, it.name);
      });
      setItemMap(map);
      return map;
    } catch (e) {
      console.warn('[opgg] 物品映射获取失败，装备名将回退为英文：', e.message);
      return {};
    }
  }
}

function tierOf(deck) {
  const op = deck.stat?.opTier;
  if (op) {
    const m = { OP: 'T0', S: 'T0', A: 'T1', B: 'T2' };
    if (m[op]) return m[op];
  }
  const score = deck.stat?.opScore ?? 0;
  if (score >= 4) return 'T0';
  if (score >= 3) return 'T1';
  return 'T2';
}

function slug(name) {
  return 'opgg-' + String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
}

export async function fetchMetaDecks(limit = 30) {
  const client = new OpggClient();
  await client.init();
  await client.buildItemMap();

  const meta = await client.callTool('tft_list_meta_decks', { lang: 'zh_CN', limit });
  const decks = meta.data || [];

  const setNo = meta.set || (decks[0]?.teamCode?.match(/TFTSet(\d+)/)?.[1]);
  const patch = meta.version || (decks[0]?.stat ? '' : '');
  const versionId = guessSet(patch || setNo || '18');

  const comps = decks
    .map((d) => {
      // 过滤非单位 key：OP.GG 会把 PVE 野怪（石甲虫/魔沼蛙/远古巨龙等）漏进阵容榜，
      // 但在金铲铲 S18「自然之力」中这些「峡谷野怪」本身就是可上场真单位，
      // isChampionKey 已扩展接受它们，故全部保留。无可识别单位的纯脏数据才丢弃。
      const realUnits = (d.units || []).filter((u) => isChampionKey(u.key));
      if (realUnits.length === 0) return null;

      const toUnit = (u) => ({
        champ: translateChamp(u.key),
        cost: jccCost(u.key) ?? u.tier, // 金铲铲独占野怪用专属费用（如远古巨龙=7），其余用 OP.GG tier
        carry: !!u.isCore,
        stars: 2,
        items: (u.items || []).map((k) => translateItem(k)),
      });

      // roster = 全部真实英雄（无论是否有站位坐标）；positions = 有坐标、可落盘的真实英雄。
      const roster = realUnits.map(toUnit);
      const hasCell = (u) => u.cell && typeof u.cell.x === 'number' && typeof u.cell.y === 'number';
      const positions = realUnits
        .filter(hasCell)
        .map((u) => ({
          ...toUnit(u),
          // OP.GG cell.y=1 为后排（远离敌人），row 索引 3 对应后排；y=4 为前排，row 0。
          row: Math.max(0, Math.min(3, 4 - u.cell.y)),
          col: Math.max(0, u.cell.x - 1),
        }))
        .sort((a, b) => a.row - b.row || a.col - b.col);

      const traits = (d.traits || [])
        .map((t) => translateTrait(t.key))
        .filter((v, i, a) => a.indexOf(v) === i);

      const coreUnits = roster.filter((p) => p.carry).map((p) => p.champ);
      const nameZh = d.name?.zh_CN || d.name?.en_US || slug(d.id);
      const s = d.stat || {};

      return {
        compId: `opgg-${d.id || slug(nameZh)}`,
        versionId,
        name: nameZh,
        alias: d.name?.en_US || '',
        tier: tierOf(d),
        coreChampions: coreUnits,
        traits,
        coreItems: roster.find((p) => p.carry)?.items || [],
        earlyGame: '',
        midGame: '',
        lateGame: '',
        counters: [],
        counteredBy: [],
        stationMapUrl: '',
        positionTip: '',
        aiComment: '',
        positions,
        roster,
        hasStation: positions.length > 0,
        stat: {
          avgPlacement: s.avgPlacement, top4Rate: s.top4Rate,
          winRate: s.winRate, pickRate: s.pickRate, opScore: s.opScore,
        },
        source: 'opgg',
        updatedAt: new Date().toISOString().slice(0, 10),
      };
    })
    .filter(Boolean);

  return { comps, versionId, setNo, patch: patch || setNo };
}
