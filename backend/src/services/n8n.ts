import axios from 'axios';

export async function triggerN8nWorkflow(
  webhookUrl: string,
  payload: Record<string, any>
) {
  try {
    const res = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    return { success: true, data: res.data };
  } catch (err: any) {
    console.error('n8n trigger failed:', err.message);
    return { success: false, error: err.message };
  }
}

// Standard payload sent to n8n for every new message
export function buildN8nPayload(data: {
  event: string;           // 'new_message' | 'conversation_resolved' | 'new_contact'
  tenantId: string;
  tenantSlug: string;
  contactName: string;
  contactPhone: string;
  message: string;
  channel: string;
  conversationId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}) {
  return {
    event: data.event,
    tenant: { id: data.tenantId, slug: data.tenantSlug },
    contact: { name: data.contactName, phone: data.contactPhone },
    message: { text: data.message, channel: data.channel },
    conversation: { id: data.conversationId },
    timestamp: data.timestamp,
    metadata: data.metadata || {},
  };
}
