import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import 'dotenv/config';

// Plugins
import supabasePlugin from './plugins/supabase';
import authPlugin from './plugins/auth';

// Routes
import webhookRoutes from './routes/webhooks/meta';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import conversationRoutes from './routes/conversations';
import messageRoutes from './routes/messages';
import contactRoutes from './routes/contacts';
import agentRoutes from './routes/agents';
import dashboardRoutes from './routes/dashboard';
import tenantRoutes from './routes/tenant';

// ── Create Fastify with simple logger (no pino-pretty needed) ──
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

async function start() {
  // ── Security ─────────────────────────────────────────────────
  await fastify.register(helmet, { contentSecurityPolicy: false });
  await fastify.register(cors, {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      /\.vercel\.app$/,
      /\.railway\.app$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    skipOnError: true,
  });

  // ── Plugins ──────────────────────────────────────────────────
  await fastify.register(supabasePlugin);
  await fastify.register(authPlugin);

  // ── Root info / health check ─────────────────────────────────
  fastify.get('/', async () => ({
    status: 'ok',
    message: 'AutoFlow backend is running. Use /health or /api routes.',
    health: '/health',
    api: '/api',
  }));

  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }));

  // ── Public routes (no auth required) ─────────────────────────
  await fastify.register(webhookRoutes, { prefix: '/api' });
  await fastify.register(authRoutes,    { prefix: '/api/auth' });

  // ── Protected routes (auth required) ─────────────────────────
  await fastify.register(dashboardRoutes,    { prefix: '/api/dashboard' });
  await fastify.register(conversationRoutes, { prefix: '/api/conversations' });
  await fastify.register(messageRoutes,      { prefix: '/api/messages' });
  await fastify.register(contactRoutes,      { prefix: '/api/contacts' });
  await fastify.register(agentRoutes,        { prefix: '/api/agents' });
  await fastify.register(tenantRoutes,       { prefix: '/api/tenant' });

  // ── Admin routes (superadmin only) ───────────────────────────
  await fastify.register(adminRoutes, { prefix: '/api/admin' });

  // ── Start server ─────────────────────────────────────────────
  const port = Number(process.env.PORT) || 3001;
  await fastify.listen({ port, host: '0.0.0.0' });
  console.log(`\n✅ AutoFlow Backend running → http://localhost:${port}`);
  console.log(`   Health check → http://localhost:${port}/health\n`);
}

start().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
