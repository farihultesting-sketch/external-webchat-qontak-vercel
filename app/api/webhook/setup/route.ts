import { NextResponse } from 'next/server';

const QONTAK_BASE_URL = 'https://service-chat.qontak.com/api/open';

function resolveBaseUrl(req: Request): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, '');
  }
  return new URL(req.url).origin.replace(/\/+$/, '');
}

async function registerWebhooks(req: Request) {
  const token = process.env.QONTAK_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'QONTAK_API_TOKEN belum diset di environment' },
      { status: 500 }
    );
  }

  const baseUrl = resolveBaseUrl(req);
  const webhookUrl = `${baseUrl}/api/webhook/qontak`;

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const [roomRes, messageRes] = await Promise.all([
    fetch(`${QONTAK_BASE_URL}/v1/room_interactions`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        room_created: false,
        room_resolved: true,
        url: webhookUrl,
      }),
    }),
    fetch(`${QONTAK_BASE_URL}/v1/message_interactions`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        receive_message_from_agent: true,
        receive_message_from_customer: false,
        broadcast_log_status: false,
        status_message: false,
        url: webhookUrl,
      }),
    }),
  ]);

  const [roomData, messageData] = await Promise.all([
    roomRes.json().catch(() => null),
    messageRes.json().catch(() => null),
  ]);

  if (!roomRes.ok || !messageRes.ok) {
    return NextResponse.json(
      {
        ok: false,
        webhookUrl,
        roomStatus: roomRes.status,
        messageStatus: messageRes.status,
        roomData,
        messageData,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    webhookUrl,
    room_interactions: roomData?.status ?? 'success',
    message_interactions: messageData?.status ?? 'success',
  });
}

export async function GET(req: Request) {
  return registerWebhooks(req);
}

export async function POST(req: Request) {
  return registerWebhooks(req);
}