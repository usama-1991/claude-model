import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function messageRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/:conversationId', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const { conversationId } = req.params as any;
    const { data } = await fastify.supabase.from('messages').select('*').eq('conversation_id', conversationId).eq('tenant_id', user.tenant_id).order('created_at', { ascending: true });
    return reply.send(data || []);
  });
}
