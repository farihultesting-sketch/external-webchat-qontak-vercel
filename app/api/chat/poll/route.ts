import { NextResponse } from 'next/server';
import { getSession } from '@/lib/sessionStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ messages: [], resolved: false });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ messages: [], resolved: false });
  }

  return NextResponse.json({
    messages: session.agentMessages,
    resolved: session.resolved,
  });
}