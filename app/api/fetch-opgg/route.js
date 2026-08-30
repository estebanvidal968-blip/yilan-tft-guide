import { NextResponse } from 'next/server';
import { fetchMetaDecks } from '@/lib/opgg';

export const dynamic = 'force-dynamic';

// 触发一次 OP.GG 实时抓取（仅服务端）。
// 用法：GET /api/fetch-opgg?limit=12  ->  返回 { ok, count, versionId, patch, comps }
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') || 30), 60);
  try {
    const { comps, versionId, patch } = await fetchMetaDecks(limit);
    return NextResponse.json({ ok: true, count: comps.length, versionId, patch, comps });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 502 });
  }
}
