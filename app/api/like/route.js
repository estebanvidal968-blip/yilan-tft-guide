import { NextResponse } from 'next/server';
import { getLikeCount, adjustLike } from '@/lib/socialStore';

export const dynamic = 'force-dynamic';

// GET /api/like?compId=xxx  → 当前总赞数
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const compId = searchParams.get('compId');
  if (!compId) return NextResponse.json({ ok: false, message: 'compId required' }, { status: 400 });
  const count = await getLikeCount(compId);
  return NextResponse.json({ ok: true, count });
}

// POST /api/like  body: { compId, delta: 1 | -1 }  → 增减后总赞数
// 是否「本用户已赞」由前端 localStorage 维护，服务端只负责全局计数，避免重复计数。
export async function POST(req) {
  try {
    const { compId, delta } = await req.json();
    if (!compId) return NextResponse.json({ ok: false, message: 'compId required' }, { status: 400 });
    const d = Number(delta);
    if (d !== 1 && d !== -1) return NextResponse.json({ ok: false, message: 'delta must be 1 or -1' }, { status: 400 });
    const count = await adjustLike(compId, d);
    return NextResponse.json({ ok: true, count });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
