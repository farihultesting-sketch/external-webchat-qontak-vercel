import { NextResponse } from 'next/server';
import { getSessionByRoomId, saveSession } from '@/lib/sessionStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook Qontak masuk:', JSON.stringify(body));

    const event = body.data_event || body.event || body.type;
    const roomId = body.room?.id || body.room_id || body.data?.room?.id || body.id;

    if (!roomId) {
      return NextResponse.json({ ok: true });
    }

    const session = await getSessionByRoomId(roomId);
    if (!session) {
      return NextResponse.json({ ok: true });
    }

    const senderType =
      body.sender_type || body.message?.sender_type || body.participant_type;
    const messageType = body.type || body.message?.type;
    const messageText = body.text || body.message?.text || '';
    const messageId = body.id || body.message?.id || `agent-${Date.now()}`;

    const isResolvedEvent =
      event === 'room_resolved' ||
      event === 'resolve_room' ||
      body.status === 'resolved' ||
      body.room?.status === 'resolved' ||
      body.data?.room?.status === 'resolved' ||
      Boolean(body.room?.resolved_at || body.resolved_at) ||
      (typeof messageText === 'string' &&
        messageText.toLowerCase().includes('conversation has been resolved'));

    if (isResolvedEvent) {
      session.resolved = true;
      session.mode = 'ai';
      await saveSession(session);
      return NextResponse.json({ ok: true });
    }

    if (
      messageText &&
      messageType !== 'system' &&
      senderType !== 'system' &&
      (event === 'receive_message_from_agent' ||
        senderType === 'Models::User' ||
        senderType === 'agent')
    ) {
      const alreadyExists = session.agentMessages.some(
        (m) => m.id === messageId
      );
      if (!alreadyExists) {
        session.agentMessages.push({
          id: messageId,
          sender: 'agent',
          text: messageText,
          timestamp: Date.now(),
        });
        await saveSession(session);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error webhook Qontak:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}