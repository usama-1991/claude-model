import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require superadmin role
  fastify.addHook('preHandler', fastify.authenticate);
  fastify.addHook('preHandler', fastify.requireSuperAdmin);

  // ── GET all tenants ──────────────────────────────────────────
  fastify.get('/tenants', async (_req, reply) => {
    const { data, error } = await fastify.supabase
      .from('tenants')
      .select(`*, plans(name, display_name), users(count)`)
      .order('created_at', { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });

  // ── GET single tenant ────────────────────────────────────────
  fastify.get('/tenants/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { data, error } = await fastify.supabase
      .from('tenants')
      .select(`*, plans(*), users(*), agents(*), integrations(*)`)
      .eq('id', id)
      .single();

    if (error) return reply.status(404).send({ error: 'Tenant not found' });
    return reply.send(data);
  });

  // ── CREATE tenant ────────────────────────────────────────────
  fastify.post('/tenants', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;

    // Get plan id
    const { data: plan } = await fastify.supabase
      .from('plans')
      .select('id')
      .eq('name', body.plan_name || 'starter')
      .single();

    const { data, error } = await fastify.supabase
      .from('tenants')
      .insert({
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        niche: body.niche,
        plan_id: plan?.id,
        status: body.status || 'trial',
      })
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });

    // Log action
    await fastify.supabase.from('audit_logs').insert({
      performed_by: (request as any).user.id,
      action: 'tenant_created',
      resource_type: 'tenant',
      resource_id: data.id,
      details: { name: data.name },
    });

    return reply.status(201).send(data);
  });

  // ── UPDATE tenant (plan, status, permissions) ────────────────
  fastify.patch('/tenants/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const allowedFields = ['name', 'status', 'plan_id', 'whatsapp_number',
      'whatsapp_phone_id', 'whatsapp_token', 'instagram_page_id',
      'facebook_page_id', 'settings', 'trial_ends_at'];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    // If updating plan by name
    if (body.plan_name) {
      const { data: plan } = await fastify.supabase
        .from('plans')
        .select('id')
        .eq('name', body.plan_name)
        .single();
      if (plan) updateData.plan_id = plan.id;
    }

    const { data, error } = await fastify.supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });

    await fastify.supabase.from('audit_logs').insert({
      performed_by: (request as any).user.id,
      action: 'tenant_updated',
      resource_type: 'tenant',
      resource_id: id,
      details: updateData,
    });

    return reply.send(data);
  });

  // ── Suspend / activate tenant ────────────────────────────────
  fastify.post('/tenants/:id/suspend', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { data, error } = await fastify.supabase
      .from('tenants')
      .update({ status: 'suspended' })
      .eq('id', id)
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return reply.send({ message: 'Tenant suspended', tenant: data });
  });

  fastify.post('/tenants/:id/activate', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { data, error } = await fastify.supabase
      .from('tenants')
      .update({ status: 'active' })
      .eq('id', id)
      .select()
      .single();

    if (error) return reply.status(400).send({ error: error.message });
    return reply.send({ message: 'Tenant activated', tenant: data });
  });

  // ── GET all users ─────────────────────────────────────────────
  fastify.get('/users', async (_req, reply) => {
    const { data, error } = await fastify.supabase
      .from('users')
      .select(`*, tenants(name, slug, status)`)
      .order('created_at', { ascending: false });

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });

  // ── Invite user to a tenant ───────────────────────────────────
  fastify.post('/users/invite', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { email: string; tenant_id: string; role: string };

    // Create Supabase auth user with magic link (they get email to set password)
    const { data: authUser, error: authError } = await fastify.supabase.auth.admin.inviteUserByEmail(
      body.email,
      { data: { tenant_id: body.tenant_id, role: body.role } }
    );

    if (authError) return reply.status(400).send({ error: authError.message });

    // Update their profile with tenant + role
    await fastify.supabase.from('users').update({
      tenant_id: body.tenant_id,
      role: body.role,
    }).eq('id', authUser.user.id);

    return reply.status(201).send({ message: 'Invite sent', user: authUser.user });
  });

  // ── Platform stats for admin dashboard ───────────────────────
  fastify.get('/stats', async (_req, reply) => {
    const [
      { count: totalTenants },
      { count: activeTenants },
      { count: totalMessages },
      { count: totalConversations },
    ] = await Promise.all([
      fastify.supabase.from('tenants').select('*', { count: 'exact', head: true }),
      fastify.supabase.from('tenants').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      fastify.supabase.from('messages').select('*', { count: 'exact', head: true }),
      fastify.supabase.from('conversations').select('*', { count: 'exact', head: true }),
    ]);

    return reply.send({
      tenants: { total: totalTenants, active: activeTenants },
      messages: { total: totalMessages },
      conversations: { total: totalConversations },
    });
  });

  // ── Audit log ─────────────────────────────────────────────────
  fastify.get('/audit', async (_req, reply) => {
    const { data, error } = await fastify.supabase
      .from('audit_logs')
      .select(`*, users(email, full_name)`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return reply.status(500).send({ error: error.message });
    return reply.send(data);
  });
}
