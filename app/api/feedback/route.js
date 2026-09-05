import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

// 纠错 / 反馈 接收端：仅落盘到服务端数据卷（data/social/feedback.jsonl），不接邮箱、不外发。
export const runtime = 'nodejs';

const DATA_DIR = path.join(process.cwd(), 'data', 'social');
const FILE = path.join(DATA_DIR, 'feedback.jsonl');

const TYPES = ['纠错', '建议', '其他'];

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const type = TYPES.includes(body.type) ? body.type : '建议';
    const content = (body.content || '').toString().trim();
    const contact = (body.contact || '').toString().trim().slice(0, 120);
    const comp = (body.comp || '').toString().trim().slice(0, 80);
    const name = (body.name || '').toString().trim().slice(0, 80);
    const page = (body.page || '').toString().trim().slice(0, 240);

    if (content.length < 2) {
      return NextResponse.json({ ok: false, error: '反馈内容不能为空' }, { status: 400 });
    }

    const rec = {
      ts: new Date().toISOString(),
      type,
      content: content.slice(0, 2000),
      contact,
      comp,
      name,
      page,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '',
      ua: (req.headers.get('user-agent') || '').slice(0, 240),
    };

    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.appendFileSync(FILE, JSON.stringify(rec) + '\n', 'utf8');
    } catch (e) {
      return NextResponse.json({ ok: false, error: '存储失败：' + e.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, msg: '已收到，感谢反馈！' });
  } catch (e) {
    return NextResponse.json({ ok: false, error: '请求异常' }, { status: 500 });
  }
}
