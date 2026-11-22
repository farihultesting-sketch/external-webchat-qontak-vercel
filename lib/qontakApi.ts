const QONTAK_CODE = 'Lg5l58fDDf7p2r1J20t-fg';
const QONTAK_WIDGET_ID = '72d4b056-b8a5-45bb-b212-66049ac12dc0';
const QONTAK_WEBCHAT_URL = `https://chat-service.qontak.com/webhooks/v1/webchat/${QONTAK_CODE}/widget_id/${QONTAK_WIDGET_ID}`;

export async function startQontakConversation(params: {
  sessionId: string;
  widgetDomain: string;
  name?: string;
  email?: string;
  phone?: string;
}) {
  const shortId = params.sessionId.slice(0, 6);
  const email = params.email || `visitor-${shortId}@guest.local`;
  const name = params.name || `Pengunjung ${shortId}`;
  const phone_number = params.phone || '+628000000000';
  const ext_id = Buffer.from(
    `${QONTAK_WIDGET_ID}_${QONTAK_CODE}_${Date.now()}`
  ).toString('base64');

  const res = await fetch(QONTAK_WEBCHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: params.widgetDomain,
      Referer: `${params.widgetDomain}/`,
    },
    body: JSON.stringify({
      action: 'start_conversation',
      code: QONTAK_CODE,
      widget_id: QONTAK_WIDGET_ID,
      widget_domain: params.widgetDomain,
      resource_type: 'web',
      ext_id,
      name,
      email,
      phone_number,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Qontak start_conversation gagal (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return {
    roomId: data.room?.id as string,
    accountUniqId: (data.room?.account_uniq_id || email) as string,
    extId: ext_id,
  };
}

export async function sendQontakMessage(params: {
  roomId: string;
  accountUniqId: string;
  extId: string;
  widgetDomain: string;
  text: string;
}) {
  const res = await fetch(QONTAK_WEBCHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: params.widgetDomain,
      Referer: `${params.widgetDomain}/`,
    },
    body: JSON.stringify({
      action: 'send_message',
      type: 'text',
      text: params.text,
      room_id: params.roomId,
      account_uniq_id: params.accountUniqId,
      ext_id: params.extId,
      widget_domain: params.widgetDomain,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Qontak send_message gagal (${res.status}): ${errText}`);
  }

  return res.json();
}