import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function tenantRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/me', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const { data } = await fastify.supabase.from('tenants').select('*, plans(*)').eq('id', user.tenant_id).single();
    return reply.send(data);
  });

  fastify.patch('/me', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const body = req.body as any;
    const allowed = ['name', 'whatsapp_number', 'whatsapp_phone_id', 'whatsapp_token', 'instagram_page_id', 'facebook_page_id', 'n8n_webhook_url', 'settings', 'logo_url', 'primary_color'];
    const update: any = {};
    for (const key of allowed) { if (body[key] !== undefined) update[key] = body[key]; }
    const { data, error } = await fastify.supabase.from('tenants').update(update).eq('id', user.tenant_id).select().single();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.send(data);
  });

  fastify.get('/integrations', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const { data } = await fastify.supabase.from('integrations').select('*').eq('tenant_id', user.tenant_id);
    return reply.send(data || []);
  });

  fastify.put('/integrations/:type', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user;
    const { type } = req.params as any;
    const body = req.body as any;
    const { data, error } = await fastify.supabase.from('integrations').upsert({ tenant_id: user.tenant_id, type, name: body.name || type, config: body.config, is_connected: body.is_connected }, { onConflict: 'tenant_id,type' }).select().single();
    if (error) return reply.status(400).send({ error: error.message });
    return reply.send(data);
  });
}
