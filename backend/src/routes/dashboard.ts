import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const tenantId = user.tenant_id;

    const [
      { count: totalConversations },
      { count: openConversations },
      { count: totalMessages },
      { count: totalContacts },
      { data: recentConversations },
    ] = await Promise.all([
      fastify.supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      fastify.supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'open'),
      fastify.supabase.from('messages').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      fastify.supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      fastify.supabase.from('conversations').select('*, contacts(name, phone)').eq('tenant_id', tenantId).order('last_message_at', { ascending: false }).limit(5),
    ]);

    // Channel breakdown
    const { data: channelData } = await fastify.supabase
      .from('conversations')
      .select('channel')
      .eq('tenant_id', tenantId);

    const channels = (channelData || []).reduce((acc: any, c: any) => {
      acc[c.channel] = (acc[c.channel] || 0) + 1;
      return acc;
    }, {});

    return reply.send({
      stats: {
        total_conversations: totalConversations,
        open_conversations: openConversations,
        total_messages: totalMessages,
        total_contacts: totalContacts,
      },
      channels,
      recent_conversations: recentConversations,
    });
  });
}
