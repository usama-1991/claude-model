import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  parseWhatsAppWebhook, parseInstagramWebhook, parseFacebookWebhook,
  sendWhatsAppText, sendInstagramMessage, sendFacebookMessage, markWhatsAppRead,
} from '../../services/meta';
import { generateAgentReply } from '../../services/openai';
import { triggerN8nWorkflow, buildN8nPayload } from '../../services/n8n';

export default async function webhookRoutes(fastify: FastifyInstance) {

  // ── Webhook Verification (GET) ──────────────────────────────
  // Meta calls this when you first register the webhook
  fastify.get('/webhook/:channel', async (request: FastifyRequest, reply: FastifyReply) => {
    const { channel } = request.params as { channel: string };
    const { 'hub.mode': mode, 'hub.verify_token': verifyToken, 'hub.challenge': challenge } =
      request.query as Record<string, string>;

    fastify.log.info(`Webhook verify request for ${channel}: mode=${mode}`);

    // Look up tenant by verify token
    const { data: tenant } = await fastify.supabase
      .from('tenants')
      .select('id, meta_verify_token')
      .eq('meta_verify_token', verifyToken)
      .single();

    if (mode === 'subscribe' && tenant) {
      fastify.log.info(`✅ Webhook verified for tenant ${tenant.id}`);
      return reply.status(200).send(challenge);
    }

    // Also check global verify token for initial setup
    if (mode === 'subscribe' && verifyToken === process.env.META_VERIFY_TOKEN) {
      return reply.status(200).send(challenge);
    }

    return reply.status(403).send('Verification failed');
  });

  // ── WhatsApp Webhook (POST) ──────────────────────────────────
  fastify.post('/webhook/whatsapp', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.status(200).send('OK'); // Always respond 200 immediately to Meta

    const body = request.body as any;
    
    // TEMPORARY DEBUG: Log the raw payload from Meta
    fastify.log.info({ rawBody: body }, 'RAW WHATSAPP WEBHOOK PAYLOAD');

    const parsed = parseWhatsAppWebhook(body);
    if (!parsed) {
      fastify.log.warn('Webhook payload could not be parsed as a message (might be a status update).');
      return;
    }

    fastify.log.info(`📱 WhatsApp message from ${parsed.from}`);

    await processIncomingMessage({
      fastify,
      channel: 'whatsapp',
      externalId: parsed.from,           // Customer WA phone number
      externalMessageId: parsed.messageId,
      text: parsed.text,
      phoneNumberId: parsed.phoneNumberId, // Used to find which tenant this belongs to
    });
  });

  // ── Instagram Webhook (POST) ─────────────────────────────────
  fastify.post('/webhook/instagram', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.status(200).send('OK');

    const body = request.body as any;
    const parsed = parseInstagramWebhook(body);
    if (!parsed) return;

    fastify.log.info(`📸 Instagram message from ${parsed.senderId}`);

    await processIncomingMessage({
      fastify,
      channel: 'instagram',
      externalId: parsed.senderId,
      externalMessageId: parsed.messageId,
      text: parsed.text,
      pageId: parsed.recipientId,
    });
  });

  // ── Facebook Webhook (POST) ──────────────────────────────────
  fastify.post('/webhook/facebook', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.status(200).send('OK');

    const body = request.body as any;
    const parsed = parseFacebookWebhook(body);
    if (!parsed) return;

    fastify.log.info(`📘 Facebook message from ${parsed.senderId}`);

    await processIncomingMessage({
      fastify,
      channel: 'facebook',
      externalId: parsed.senderId,
      externalMessageId: parsed.messageId,
      text: parsed.text,
      pageId: parsed.recipientId,
    });
  });
}

// ── Core message processing function ─────────────────────────────────────────

async function processIncomingMessage({
  fastify,
  channel,
  externalId,
  externalMessageId,
  text,
  phoneNumberId,
  pageId,
}: {
  fastify: FastifyInstance;
  channel: 'whatsapp' | 'instagram' | 'facebook';
  externalId: string;
  externalMessageId: string;
  text: string;
  phoneNumberId?: string;
  pageId?: string;
}) {
  const supabase = fastify.supabase;

  fastify.log.info(`🛠️ Processing ${channel} message from ${externalId}...`);

  // 1. Find tenant by phone_number_id or page_id
  let tenant: any = null;

  if (channel === 'whatsapp' && phoneNumberId) {
    fastify.log.info(`🔍 Searching for tenant with WhatsApp Phone ID: ${phoneNumberId}`);
    const { data, error } = await supabase
      .from('tenants')
      .select('*, agents(*)')
      .eq('whatsapp_phone_id', phoneNumberId)
      .single();
    if (error) fastify.log.error(error, 'Error finding tenant:');
    tenant = data;
  } else if ((channel === 'instagram' || channel === 'facebook') && pageId) {
    fastify.log.info(`🔍 Searching for tenant with Page ID: ${pageId}`);
    const field = channel === 'instagram' ? 'instagram_page_id' : 'facebook_page_id';
    const { data, error } = await supabase
      .from('tenants')
      .select('*, agents(*)')
      .eq(field, pageId)
      .single();
    if (error) fastify.log.error(error, 'Error finding tenant:');
    tenant = data;
  }

  if (!tenant) {
    fastify.log.warn(`⚠️ No tenant found for ${channel} ID: ${phoneNumberId || pageId}`);
    return;
  }

  fastify.log.info(`✅ Found tenant: ${tenant.name} (${tenant.id})`);

  // 2. Check plan allows this channel
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('channels')
    .eq('id', tenant.plan_id)
    .single();

  if (planError) fastify.log.error(planError, 'Error fetching plan:');

  const allowedChannels = typeof plan?.channels === 'string' ? JSON.parse(plan.channels) : (plan?.channels || []);
  
  if (!allowedChannels.includes(channel)) {
    fastify.log.warn(`🚫 Tenant ${tenant.id} plan does not include ${channel}. Allowed: ${JSON.stringify(allowedChannels)}`);
    return;
  }

  fastify.log.info(`📦 Plan check passed. Proceeding with contact upsert...`);

  // 3. Upsert contact
  const contactField = channel === 'whatsapp' ? 'whatsapp_id' : channel === 'instagram' ? 'instagram_id' : 'facebook_id';
  let contact: any;

  const { data: existingContact } = await supabase
    .from('contacts')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq(contactField, externalId)
    .single();

  if (existingContact) {
    contact = existingContact;
    await supabase.from('contacts').update({
      last_contacted_at: new Date().toISOString(),
      total_conversations: existingContact.total_conversations + 1,
    }).eq('id', existingContact.id);
  } else {
    const { data: newContact } = await supabase
      .from('contacts')
      .insert({
        tenant_id: tenant.id,
        [contactField]: externalId,
        phone: channel === 'whatsapp' ? externalId : null,
        name: externalId,
        last_contacted_at: new Date().toISOString(),
        total_conversations: 1,
      })
      .select()
      .single();
    contact = newContact;
  }

  // 4. Find or create conversation
  let conversation: any;
  const { data: existingConvo } = await supabase
    .from('conversations')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('contact_id', contact.id)
    .eq('channel', channel)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingConvo) {
    conversation = existingConvo;
    await supabase.from('conversations').update({
      last_message_at: new Date().toISOString(),
      last_message_preview: text.slice(0, 100),
      unread_count: (existingConvo.unread_count || 0) + 1,
    }).eq('id', existingConvo.id);
  } else {
    const { data: newConvo } = await supabase
      .from('conversations')
      .insert({
        tenant_id: tenant.id,
        contact_id: contact.id,
        channel,
        status: 'open',
        ai_enabled: true,
        last_message_at: new Date().toISOString(),
        last_message_preview: text.slice(0, 100),
        unread_count: 1,
      })
      .select()
      .single();
    conversation = newConvo;
  }

  // 5. Store inbound message (check dedup first)
  const { data: existing } = await supabase
    .from('messages')
    .select('id')
    .eq('meta_message_id', externalMessageId)
    .single();

  if (existing) return; // Already processed

  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    tenant_id: tenant.id,
    direction: 'inbound',
    sender_type: 'customer',
    sender_id: externalId,
    content: text,
    content_type: 'text',
    meta_message_id: externalMessageId,
    status: 'delivered',
  });

  // 6. Trigger n8n if configured
  if (tenant.n8n_webhook_url) {
    triggerN8nWorkflow(
      tenant.n8n_webhook_url,
      buildN8nPayload({
        event: 'new_message',
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        contactName: contact.name || externalId,
        contactPhone: contact.phone || externalId,
        message: text,
        channel,
        conversationId: conversation.id,
        timestamp: new Date().toISOString(),
      })
    );
  }

  // 7. Generate and send AI reply if enabled
  if (!conversation.ai_enabled) return;

  const agent = tenant.agents?.find((a: any) => a.is_published && a.channels?.includes(channel));
  if (!agent) return;

  // Get conversation history for context
  const { data: history } = await supabase
    .from('messages')
    .select('direction, sender_type, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })
    .limit(20);

  const conversationHistory = (history || []).map((m: any) => ({
    role: m.sender_type === 'customer' ? 'user' as const : 'assistant' as const,
    content: m.content,
  }));

  let aiReply: string;
  let tokensUsed = 0;

  try {
    const result = await generateAgentReply(
      {
        name: agent.name,
        systemRole: agent.system_role,
        tone: agent.tone,
        dos: agent.dos || [],
        donts: agent.donts || [],
      },
      conversationHistory,
      text,
      tenant.openai_key
    );
    aiReply = result.reply;
    tokensUsed = result.tokensUsed;
  } catch (err: any) {
    fastify.log.error(err, 'AI generation failed:');
    return;
  }

  // 8. Send reply back via Meta
  try {
    if (channel === 'whatsapp') {
      await sendWhatsAppText(tenant.whatsapp_phone_id, tenant.whatsapp_token, externalId, aiReply);
      await markWhatsAppRead(tenant.whatsapp_phone_id, tenant.whatsapp_token, externalMessageId);
    } else if (channel === 'instagram') {
      await sendInstagramMessage(tenant.instagram_page_id, tenant.whatsapp_token, externalId, aiReply);
    } else {
      await sendFacebookMessage(tenant.facebook_page_id, tenant.whatsapp_token, externalId, aiReply);
    }

    // 9. Store outbound AI message
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      tenant_id: tenant.id,
      direction: 'outbound',
      sender_type: 'bot',
      sender_id: agent.id,
      content: aiReply,
      content_type: 'text',
      status: 'sent',
      ai_model: 'gpt-4o',
      ai_tokens_used: tokensUsed,
    });

  } catch (err: any) {
    fastify.log.error(err, 'Failed to send AI reply:');
  }
}
