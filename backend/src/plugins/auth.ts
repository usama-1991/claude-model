import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireSuperAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: {
      id: string;
      email: string;
      role: string;
      tenant_id: string | null;
    };
  }
}

export default fp(async (fastify: FastifyInstance) => {

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Missing authorization header' });
      }
      const token = authHeader.split(' ')[1];

      // Verify with Supabase service key on server side
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return reply.status(401).send({ error: 'Invalid or expired token' });
      }

      // Get profile
      const { data: profile } = await fastify.supabase
        .from('users')
        .select('id, email, role, tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return reply.status(401).send({ error: 'User profile not found' });
      }
      request.user = profile;
    } catch (_err) {
      return reply.status(401).send({ error: 'Authentication failed' });
    }
  });

  fastify.decorate('requireSuperAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.user?.role !== 'superadmin') {
      return reply.status(403).send({ error: 'Superadmin access required' });
    }
  });

  fastify.log.info('✅ Auth plugin loaded');
});
