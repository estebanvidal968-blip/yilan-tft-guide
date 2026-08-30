import { NextResponse } from 'next/server';
import { generateComment } from '@/lib/hunyuan';

export const dynamic = 'force-dynamic';

// 服务端调用腾讯混元，为一套阵容生成中文评语。
// 密钥仅来自环境变量（HUNYUAN_SECRET_ID / HUNYUAN_SECRET_KEY），绝不进前端。
// 用法：POST /api/ai-comment  body: { name, positions, traits, stat }
export async function POST(req) {
  try {
    const comp = await req.json();
    const comment = await generateComment(comp);
    return NextResponse.json({ ok: true, comment });
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 502 });
  }
}
