import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function agentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const { data } = await fastify.supabase.from('agents').select('*, knowledge_docs(*)').eq('tenant_id', user.tenant_id);
    return reply.send(data || []);
  });

  fastify.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const body = req.body as any;
    const { data, error } = await fastify.supabase.from('agents').insert({ ...body, tenant_id: user.tenant_id }).select().single();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.status(201).send(data);
  });

  fastify.patch('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const { id } = req.params as any;
    const body = req.body as any;
    const { data, error } = await fastify.supabase.from('agents').update(body).eq('id', id).eq('tenant_id', user.tenant_id).select().single();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.send(data);
  });

  fastify.delete('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const { id } = req.params as any;
    await fastify.supabase.from('agents').delete().eq('id', id).eq('tenant_id', user.tenant_id);
    return reply.send({ message: 'Deleted' });
  });
}
