import { NextResponse } from 'next/server';
import {
  bindRoomToSession,
  getOrCreateSession,
  saveSession,
} from '@/lib/sessionStore';
import { sendQontakMessage, startQontakConversation } from '@/lib/qontakApi';

export async function POST(req: Request) {
  try {
    const { sessionId, historySummary } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId wajib diisi' },
        { status: 400 }
      );
    }

    const origin = req.headers.get('origin') || new URL(req.url).origin;

    const session = await getOrCreateSession(sessionId);
    session.mode = 'agent';
    session.resolved = false;
    session.historySummary = historySummary || '';
    await saveSession(session);

    const { roomId, accountUniqId, extId } = await startQontakConversation({
      sessionId,
      widgetDomain: origin,
    });

    await bindRoomToSession(roomId, sessionId, extId, accountUniqId);

    const initialText = historySummary
      ? `Halo, saya ingin terhubung dengan agen.\n\n[Ringkasan Chat AI]\n${historySummary}`
      : 'Halo, saya ingin terhubung dengan agen.';

    await sendQontakMessage({
      roomId,
      accountUniqId,
      extId,
      widgetDomain: origin,
      text: initialText,
    });

    return NextResponse.json({ ok: true, roomId });
  } catch (error) {
    console.error('Error di /api/handover:', error);
    return NextResponse.json(
      { error: 'Gagal memulai sesi dengan agen Qontak' },
      { status: 500 }
    );
  }
}