-- ============================================================
-- AutoFlow AI - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PLANS & PERMISSIONS
-- ============================================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,          -- 'starter' | 'growth' | 'enterprise'
  display_name TEXT NOT NULL,
  price_usd DECIMAL(10,2) DEFAULT 0,
  price_pkr DECIMAL(10,2) DEFAULT 0,
  max_agents INTEGER DEFAULT 1,
  max_conversations INTEGER DEFAULT 500,
  max_contacts INTEGER DEFAULT 100,
  channels TEXT[] DEFAULT ARRAY['whatsapp'],
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO plans (name, display_name, price_usd, price_pkr, max_agents, max_conversations, max_contacts, channels, features) VALUES
('starter',    'Starter',    49,  13600, 1, 500,       500,   ARRAY['whatsapp'],                         '{"analytics": false, "human_handoff": false, "gallery_cards": false}'),
('growth',     'Growth',     149, 41300, 3, 99999,     5000,  ARRAY['whatsapp','instagram','facebook'],  '{"analytics": true,  "human_handoff": true,  "gallery_cards": true}'),
('enterprise', 'Enterprise', 399, 110700, 10, 9999999, 99999, ARRAY['whatsapp','instagram','facebook'],  '{"analytics": true,  "human_handoff": true,  "gallery_cards": true, "white_label": true, "api_access": true}');

-- ============================================================
-- TENANTS (Business Clients)
-- ============================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,          -- URL-safe identifier
  niche TEXT NOT NULL,                -- 'restaurant' | 'realestate' | 'dental' | etc.
  plan_id UUID REFERENCES plans(id),
  status TEXT DEFAULT 'trial',        -- 'trial' | 'active' | 'suspended' | 'cancelled'
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  whatsapp_number TEXT,
  whatsapp_phone_id TEXT,             -- Meta phone_number_id
  whatsapp_token TEXT,                -- Meta permanent token (encrypted)
  instagram_page_id TEXT,
  facebook_page_id TEXT,
  meta_verify_token TEXT DEFAULT uuid_generate_v4()::TEXT,
  meta_app_id TEXT,
  meta_app_secret TEXT,
  openai_key TEXT,                    -- Per-tenant OpenAI key (optional)
  n8n_webhook_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS (linked to Supabase Auth)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'owner',          -- 'superadmin' | 'owner' | 'agent' | 'viewer'
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTACTS (Customers of each tenant)
-- ============================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  whatsapp_id TEXT,                   -- WA customer ID
  instagram_id TEXT,
  facebook_id TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  total_conversations INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, whatsapp_id),
  UNIQUE(tenant_id, instagram_id),
  UNIQUE(tenant_id, facebook_id)
);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,              -- 'whatsapp' | 'instagram' | 'facebook'
  channel_conversation_id TEXT,      -- External ID from Meta
  status TEXT DEFAULT 'open',         -- 'open' | 'resolved' | 'pending' | 'bot'
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  ai_enabled BOOLEAN DEFAULT true,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,            -- 'inbound' | 'outbound'
  sender_type TEXT NOT NULL,          -- 'customer' | 'bot' | 'agent'
  sender_id TEXT,                     -- customer phone/id or user UUID
  content TEXT,
  content_type TEXT DEFAULT 'text',   -- 'text' | 'image' | 'document' | 'gallery' | 'template'
  media_url TEXT,
  media_type TEXT,
  meta_message_id TEXT UNIQUE,        -- Deduplication
  status TEXT DEFAULT 'sent',         -- 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  ai_model TEXT,
  ai_tokens_used INTEGER,
  n8n_triggered BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI AGENTS
-- ============================================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🤖',
  greeting_message TEXT NOT NULL,
  system_role TEXT NOT NULL,
  tone TEXT DEFAULT 'professional',
  dos TEXT[] DEFAULT ARRAY[]::TEXT[],
  donts TEXT[] DEFAULT ARRAY[]::TEXT[],
  channels TEXT[] DEFAULT ARRAY['whatsapp'],
  languages TEXT[] DEFAULT ARRAY['English (US)'],
  voice_config JSONB DEFAULT '{}',
  knowledge_base JSONB DEFAULT '[]',
  capabilities JSONB DEFAULT '{}',
  human_handoff_enabled BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- KNOWLEDGE BASE DOCUMENTS
-- ============================================================
CREATE TABLE knowledge_docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                 -- 'pdf' | 'text' | 'url' | 'spreadsheet'
  content TEXT,
  url TEXT,
  file_path TEXT,
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHANNEL INTEGRATIONS
-- ============================================================
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                 -- 'whatsapp' | 'instagram' | 'facebook' | 'n8n' | 'sheets'
  name TEXT NOT NULL,
  config JSONB DEFAULT '{}',          -- Encrypted credentials
  is_connected BOOLEAN DEFAULT false,
  last_verified_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, type)
);

-- ============================================================
-- ADMIN AUDIT LOG
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  performed_by UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_status ON conversations(tenant_id, status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_tenant ON messages(tenant_id);
CREATE INDEX idx_messages_meta_id ON messages(meta_message_id);
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_whatsapp ON contacts(tenant_id, whatsapp_id);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_agents_tenant ON agents(tenant_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tenant data
CREATE POLICY tenant_isolation ON conversations
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY tenant_isolation ON messages
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY tenant_isolation ON contacts
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY tenant_isolation ON agents
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin')
  );

-- ============================================================
-- REALTIME SUBSCRIPTIONS (enable for Supabase Realtime)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user record after Supabase Auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED: Super Admin + Demo Tenant
-- ============================================================
-- Run AFTER creating your Supabase auth user via the dashboard
-- Replace 'YOUR-SUPABASE-AUTH-UUID' with your actual auth user id

-- UPDATE users SET role = 'superadmin' WHERE email = 'admin@autoflow.ai';

-- Demo restaurant tenant
INSERT INTO tenants (name, slug, niche, status, meta_verify_token) VALUES
('Demo Restaurant', 'demo-restaurant', 'restaurant', 'active', 'autoflow_verify_demo_12345');
