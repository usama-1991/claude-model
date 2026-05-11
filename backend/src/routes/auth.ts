import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';

export default async function authRoutes(fastify: FastifyInstance) {

  // ── Login ─────────────────────────────────────────────────────
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as { email: string; password: string };

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password required' });
    }

    // Use server-side service key for login
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      fastify.log.warn({ email, status: error.status, message: error.message, details: (error as any).details }, 'Auth login failed');
      return reply.status(401).send({ error: error.message || 'Invalid email or password' });
    }

    if (!data.user) {
      fastify.log.warn({ email }, 'Auth login succeeded but user missing');
      return reply.status(401).send({ error: 'Invalid login response from Supabase' });
    }

    // Get user profile
    const { data: profile } = await fastify.supabase
      .from('users')
      .select('*, tenants(id, name, slug, niche, status, plan_id, plans(*))')
      .eq('id', data.user.id)
      .single();

    // Update last seen
    await fastify.supabase.from('users').update({ last_seen_at: new Date().toISOString() }).eq('id', data.user.id);

    return reply.send({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: profile,
    });
  });

  // ── Get current user (me) ────────────────────────────────────
  fastify.get('/me', {
    preHandler: fastify.authenticate,
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { data: profile } = await fastify.supabase
      .from('users')
      .select('*, tenants(id, name, slug, niche, status, plan_id, logo_url, primary_color, plans(*))')
      .eq('id', (request as any).user.id)
      .single();

    return reply.send(profile);
  });

  // ── Refresh token ────────────────────────────────────────────
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const { refresh_token } = request.body as { refresh_token: string };
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });

    if (error) return reply.status(401).send({ error: 'Invalid refresh token' });
    return reply.send({ access_token: data.session?.access_token, refresh_token: data.session?.refresh_token });
  });

  // ── Logout ────────────────────────────────────────────────────
  fastify.post('/logout', {
    preHandler: fastify.authenticate,
  }, async (_request, reply) => {
    return reply.send({ message: 'Logged out successfully' });
  });

  // ── Register (creates tenant + owner user) ────────────────────
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password, full_name, business_name, niche } = request.body as any;

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name } },
    });

    if (authError) return reply.status(400).send({ error: authError.message });
    if (!authData.user) return reply.status(400).send({ error: 'User creation failed' });

    // Get starter plan
    const { data: plan } = await fastify.supabase.from('plans').select('id').eq('name', 'starter').single();

    // Create tenant
    const slug = business_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data: tenant } = await fastify.supabase
      .from('tenants')
      .insert({ name: business_name, slug, niche, plan_id: plan?.id, status: 'trial' })
      .select()
      .single();

    // Link user to tenant with owner role
    await fastify.supabase.from('users').update({
      tenant_id: tenant?.id,
      role: 'owner',
      full_name,
    }).eq('id', authData.user.id);

    return reply.status(201).send({
      message: 'Account created. Please check your email to confirm.',
      user_id: authData.user.id,
      tenant_id: tenant?.id,
    });
  });
}
