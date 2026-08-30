import { NextResponse } from 'next/server';
import { getComments, addComment } from '@/lib/socialStore';

export const dynamic = 'force-dynamic';

// GET /api/comments?compId=xxx  → 该阵容全部评论（最新在前）
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const compId = searchParams.get('compId');
  if (!compId) return NextResponse.json({ ok: false, message: 'compId required' }, { status: 400 });
  const comments = await getComments(compId);
  return NextResponse.json({ ok: true, comments });
}

// POST /api/comments  body: { compId, name?, text }  → 新增评论
export async function POST(req) {
  try {
    const { compId, name, text } = await req.json();
    if (!compId || !text || !String(text).trim()) {
      return NextResponse.json({ ok: false, message: 'compId 和 text 必填' }, { status: 400 });
    }
    const comment = await addComment(compId, String(name || ''), String(text).trim());
    return NextResponse.json({ ok: true, comment });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
