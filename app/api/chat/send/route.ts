import { NextResponse } from 'next/server';
import { getOrCreateSession } from '@/lib/sessionStore';
import { sendQontakMessage } from '@/lib/qontakApi';

export async function POST(req: Request) {
  try {
    const { sessionId, text } = await req.json();

    if (!sessionId || !text) {
      return NextResponse.json(
        { error: 'sessionId dan text wajib diisi' },
        { status: 400 }
      );
    }

    const session = await getOrCreateSession(sessionId);

    if (!session.roomId || !session.accountUniqId || !session.extId) {
      return NextResponse.json(
        { error: 'Sesi Qontak belum aktif' },
        { status: 400 }
      );
    }

    const origin = req.headers.get('origin') || new URL(req.url).origin;

    await sendQontakMessage({
      roomId: session.roomId,
      accountUniqId: session.accountUniqId,
      extId: session.extId,
      widgetDomain: origin,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error di /api/chat/send:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim pesan ke Qontak' },
      { status: 500 }
    );
  }
}