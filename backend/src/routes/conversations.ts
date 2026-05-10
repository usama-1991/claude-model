import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sendWhatsAppText, sendInstagramMessage, sendFacebookMessage } from '../services/meta';

export default async function conversationRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET all conversations for tenant
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const { status, channel } = request.query as any;

    let query = fastify.supabase
      .from('conversations')
      .select(`*, contacts(id, name, phone, whatsapp_id, instagram_id, facebook_id, tags), users!assigned_to(id, full_name, email)`)
      .eq('tenant_id', user.tenant_id)
      .order('last_message_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (channel) query = query.eq('channel', channel);

    const { data, error } = await query;
    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });

  // GET single conversation + messages
  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const { data: convo } = await fastify.supabase
      .from('conversations')
      .select(`*, contacts(*), users!assigned_to(*)`)
      .eq('id', id).eq('tenant_id', user.tenant_id).single();

    if (!convo) return reply.status(404).send({ error: 'Not found' });

    const { data: messages } = await fastify.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    // Mark as read
    await fastify.supabase.from('conversations').update({ unread_count: 0 }).eq('id', id);

    return reply.send({ ...convo, messages: messages || [] });
  });

  // POST send message (agent manually replies)
  fastify.post('/:id/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const { content } = request.body as { content: string };

    const { data: convo } = await fastify.supabase
      .from('conversations')
      .select(`*, contacts(*)`)
      .eq('id', id).eq('tenant_id', user.tenant_id).single();

    if (!convo) return reply.status(404).send({ error: 'Conversation not found' });

    // Get tenant credentials
    const { data: tenant } = await fastify.supabase
      .from('tenants')
      .select('whatsapp_phone_id, whatsapp_token, instagram_page_id, facebook_page_id')
      .eq('id', user.tenant_id).single();

    // Send via Meta API
    try {
      const contact = convo.contacts;
      if (convo.channel === 'whatsapp' && contact.whatsapp_id) {
        await sendWhatsAppText(tenant!.whatsapp_phone_id, tenant!.whatsapp_token, contact.whatsapp_id, content);
      } else if (convo.channel === 'instagram' && contact.instagram_id) {
        await sendInstagramMessage(tenant!.instagram_page_id, tenant!.whatsapp_token, contact.instagram_id, content);
      } else if (convo.channel === 'facebook' && contact.facebook_id) {
        await sendFacebookMessage(tenant!.facebook_page_id, tenant!.whatsapp_token, contact.facebook_id, content);
      }
    } catch (err: any) {
      return reply.status(400).send({ error: `Failed to send: ${err.message}` });
    }

    // Store message
    const { data: msg } = await fastify.supabase.from('messages').insert({
      conversation_id: id, tenant_id: user.tenant_id,
      direction: 'outbound', sender_type: 'agent',
      sender_id: user.id, content, content_type: 'text', status: 'sent',
    }).select().single();

    await fastify.supabase.from('conversations').update({
      last_message_at: new Date().toISOString(),
      last_message_preview: content.slice(0, 100),
    }).eq('id', id);

    return reply.status(201).send(msg);
  });

  // PATCH update conversation status / AI toggle
  fastify.patch('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const { data, error } = await fastify.supabase
      .from('conversations')
      .update({ status: body.status, ai_enabled: body.ai_enabled, assigned_to: body.assigned_to })
      .eq('id', id).eq('tenant_id', user.tenant_id)
      .select().single();

    if (error) return reply.status(400).send({ error: error.message });
    return reply.send(data);
  });
}
