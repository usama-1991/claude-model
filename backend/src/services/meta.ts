import axios from 'axios';

const GRAPH_URL = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v19.0'}`;

// ── WhatsApp ──────────────────────────────────────────────

export async function sendWhatsAppText(
  phoneNumberId: string,
  token: string,
  to: string,
  text: string
) {
  const res = await axios.post(
    `${GRAPH_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
}

export async function sendWhatsAppTemplate(
  phoneNumberId: string,
  token: string,
  to: string,
  templateName: string,
  languageCode: string = 'en',
  components: any[] = []
) {
  const res = await axios.post(
    `${GRAPH_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name: templateName, language: { code: languageCode }, components },
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
}

export async function sendWhatsAppImage(
  phoneNumberId: string,
  token: string,
  to: string,
  imageUrl: string,
  caption?: string
) {
  const res = await axios.post(
    `${GRAPH_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: imageUrl, caption },
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
}

// ── Instagram ──────────────────────────────────────────────

export async function sendInstagramMessage(
  pageId: string,
  token: string,
  recipientId: string,
  text: string
) {
  const res = await axios.post(
    `${GRAPH_URL}/${pageId}/messages`,
    {
      recipient: { id: recipientId },
      message: { text },
      messaging_type: 'RESPONSE',
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
}

// ── Facebook Messenger ──────────────────────────────────────

export async function sendFacebookMessage(
  pageId: string,
  token: string,
  recipientId: string,
  text: string
) {
  const res = await axios.post(
    `${GRAPH_URL}/${pageId}/messages`,
    {
      recipient: { id: recipientId },
      message: { text },
      messaging_type: 'RESPONSE',
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  return res.data;
}

// ── Mark messages as read ──────────────────────────────────

export async function markWhatsAppRead(
  phoneNumberId: string,
  token: string,
  messageId: string
) {
  await axios.post(
    `${GRAPH_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}

// ── Parse incoming webhook payload ──────────────────────────

export function parseWhatsAppWebhook(body: any): {
  phoneNumberId: string;
  from: string;
  messageId: string;
  text: string;
  type: string;
  timestamp: string;
} | null {
  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) return null;

    return {
      phoneNumberId: value.metadata.phone_number_id,
      from: message.from,
      messageId: message.id,
      text: message.text?.body || message.type,
      type: message.type,
      timestamp: message.timestamp,
    };
  } catch {
    return null;
  }
}

export function parseInstagramWebhook(body: any): {
  senderId: string;
  recipientId: string;
  messageId: string;
  text: string;
  timestamp: number;
} | null {
  try {
    const entry = body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    if (!messaging?.message) return null;

    return {
      senderId: messaging.sender.id,
      recipientId: messaging.recipient.id,
      messageId: messaging.message.mid,
      text: messaging.message.text || '',
      timestamp: messaging.timestamp,
    };
  } catch {
    return null;
  }
}

export function parseFacebookWebhook(body: any) {
  return parseInstagramWebhook(body); // Same structure
}
