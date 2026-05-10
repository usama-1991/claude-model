import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function contactRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const { data } = await fastify.supabase.from('contacts').select('*').eq('tenant_id', user.tenant_id).order('created_at', { ascending: false });
    return reply.send(data);
  });

  fastify.get('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const { id } = req.params as any;
    const { data } = await fastify.supabase.from('contacts').select('*, conversations(id, channel, status, last_message_at, last_message_preview)').eq('id', id).eq('tenant_id', user.tenant_id).single();
    if (!data) return reply.status(404).send({ error: 'Not found' });
    return reply.send(data);
  });

  fastify.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const body = req.body as any;
    const { data, error } = await fastify.supabase.from('contacts').insert({ ...body, tenant_id: user.tenant_id }).select().single();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.status(201).send(data);
  });

  fastify.patch('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const { id } = req.params as any;
    const body = req.body as any;
    const { data, error } = await fastify.supabase.from('contacts').update(body).eq('id', id).eq('tenant_id', user.tenant_id).select().single();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.send(data);
  });
}
