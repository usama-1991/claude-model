# AutoFlow AI — Complete Setup & Deployment Guide
## Stack: Next.js + Fastify + Supabase + Railway + Meta Cloud API + n8n

---

## CREDENTIALS (Save These)

| Role        | Email                    | Password               |
|-------------|--------------------------|------------------------|
| Super Admin | admin@autoflow.ai        | AutoFlow@Admin2026!    |
| Demo Client | demo@restaurant.com      | Demo@1234!             |

---

## STEP 1 — SUPABASE SETUP (10 minutes)

1. Go to **https://supabase.com** → New Project
2. Note your: **Project URL**, **anon key**, **service_role key**
project url: https://supabase.com/dashboard/project/lntlthdcjazpempzltze
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxudGx0aGRjamF6cGVtcHpsdHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzgzNzUsImV4cCI6MjA5Mzc1NDM3NX0.TVGC2lvSug2RRzqHwBCnZnj3RCQ_WzuFBICZcNqyLcw
service_role_key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxudGx0aGRjamF6cGVtcHpsdHplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE3ODM3NSwiZXhwIjoyMDkzNzU0Mzc1fQ.6mo6DxJ4QsmKytpCW5q0Z6cC0dsFG5R9z6B9LORn1JQ
3. Go to **SQL Editor** → paste the full content of `supabase/migrations/001_initial.sql` → Run
4. Go to **Authentication → Users** → Create user:
   - Email: `admin@autoflow.ai`
   - Password: `AutoFlow@Admin2026!`
5. Go back to **SQL Editor** → run:
   ```sql
   UPDATE users SET role = 'superadmin' WHERE email = 'admin@autoflow.ai';
   ```
6. Create demo client user:
   - Email: `demo@restaurant.com`, Password: `Demo@1234!`
7. Run:
   ```sql
   -- Get the demo restaurant tenant id first
   SELECT id FROM tenants WHERE slug = 'demo-restaurant';
   -- Then link user (replace UUID):
   UPDATE users SET role = 'owner', tenant_id = 'PASTE_TENANT_UUID_HERE'
   WHERE email = 'demo@restaurant.com';
   ```
8. Go to **Realtime** → Enable replication for `messages` and `conversations` tables

---

## STEP 2 — META API SETUP (20 minutes)

### Create Meta App
1. Go to **https://developers.facebook.com/apps/** → Create App
2. Choose **Business** type → give it a name (e.g. "AutoFlow AI")
3. Add products:
   - **WhatsApp** → Set Up
   - **Messenger** → Set Up
   - **Instagram Graph API** → Set Up

### WhatsApp Setup
1. WhatsApp → Getting Started → note your **Phone Number ID** and **Test Number**
2. Go to **System Users** (in Meta Business Suite) → Create System User → Generate token with `whatsapp_business_messaging` permission
3. Note: Phone Number ID, Permanent Access Token

### Webhook Registration
Your webhook URL format:
```
https://your-backend.railway.app/api/webhook/whatsapp
```

1. In Meta App → WhatsApp → Configuration → Webhook:
   - URL: `https://your-backend.railway.app/api/webhook/whatsapp`
   - Verify Token: `autoflow_webhook_verify_2026` (matches META_VERIFY_TOKEN in .env)
   - Subscribe to: `messages`

2. Instagram webhook:
   - URL: `https://your-backend.railway.app/api/webhook/instagram`
   - Subscribe to: `messages`, `messaging_postbacks`

3. Facebook Messenger:
   - URL: `https://your-backend.railway.app/api/webhook/facebook`
   - Subscribe to: `messages`, `messaging_postbacks`

### Update tenant with Meta credentials
```sql
UPDATE tenants
SET
  whatsapp_phone_id = 'YOUR_PHONE_NUMBER_ID',
  whatsapp_token = 'YOUR_PERMANENT_TOKEN',
  instagram_page_id = 'YOUR_INSTAGRAM_PAGE_ID',
  facebook_page_id = 'YOUR_FACEBOOK_PAGE_ID'
WHERE slug = 'demo-restaurant';
```
Or do it from the Settings page in the dashboard after login.

---

## STEP 3 — RAILWAY DEPLOYMENT (15 minutes)

### Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### Deploy Backend
```bash
cd autoflow-complete/backend
railway init           # Create new Railway project
railway link           # Link to project

# Set environment variables (do this in Railway dashboard or CLI)
railway variables set SUPABASE_URL=your_url
railway variables set SUPABASE_SERVICE_KEY=your_key
railway variables set SUPABASE_ANON_KEY=your_anon
railway variables set OPENAI_API_KEY=sk-proj-...
railway variables set META_APP_ID=your_app_id
railway variables set META_APP_SECRET=your_secret
railway variables set META_VERIFY_TOKEN=autoflow_webhook_verify_2026
railway variables set FRONTEND_URL=https://your-frontend.vercel.app
railway variables set NODE_ENV=production

railway up             # Deploy!
# Note the backend URL: https://xxxx.railway.app
```

### Deploy n8n on Railway
```bash
# In Railway dashboard → New Service → Docker Image
# Image: n8nio/n8n:latest
# Add environment variables:
# N8N_HOST=0.0.0.0
# WEBHOOK_URL=https://your-n8n.railway.app/
# N8N_ENCRYPTION_KEY=your_32_char_random_string
```

### Deploy Frontend to Vercel
```bash
cd autoflow-complete/frontend
npx vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

---

## STEP 4 — n8n SETUP (10 minutes)

1. Open your n8n URL (Railway or localhost:5678)
2. Create admin account
3. Go to **Workflows** → **Import from File**
4. Import: `n8n-workflows/autoflow-message-handler.json`
5. Configure credentials inside the workflow:
   - Google Sheets: Add your Google account
   - Airtable: Add your API key (optional)
6. Activate the workflow
7. Copy the **Webhook URL** shown in the Webhook Trigger node
8. In AutoFlow dashboard → Settings → Business → paste this URL as **n8n Webhook URL**
9. Save → your backend will now trigger n8n on every new message

---

## STEP 5 — LOCAL DEVELOPMENT

```bash
# Clone / extract the project
cd autoflow-complete

# Copy and fill environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Fill in all values from steps 1-4 above

# Option A: Docker Compose (recommended - runs everything)
docker-compose up -d

# Option B: Manual
cd backend && npm install && npm run dev   # Runs on :3001
cd frontend && npm install && npm run dev  # Runs on :3000
# n8n: docker run -p 5678:5678 n8nio/n8n

# Open http://localhost:3000
# Login: admin@autoflow.ai / AutoFlow@Admin2026!
```

---

## STEP 6 — ADDING NEW CLIENTS (Admin Flow)

1. Login as `admin@autoflow.ai`
2. Click **Admin Panel** in top banner
3. Click **New Client** → fill in:
   - Business Name, Niche, Plan
4. Go to **Users** tab → **Invite User** → enter client's email
5. Client gets magic link email to set their password
6. Client logs in → sees their own isolated dashboard
7. Client goes to **Settings** → enters their WhatsApp Phone ID + Token
8. Done — their WhatsApp messages now appear in their Conversations tab live

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│  CUSTOMER                                                        │
│  Messages on WhatsApp / Instagram / Facebook                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Webhook POST
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  FASTIFY BACKEND  (Railway)                                      │
│  /api/webhook/whatsapp   ← receives Meta webhook                │
│  /api/webhook/instagram                                          │
│  /api/webhook/facebook                                           │
│                                                                  │
│  Processing pipeline:                                            │
│  1. Find tenant by phone_number_id / page_id                    │
│  2. Check plan allows this channel                               │
│  3. Upsert contact in Supabase                                   │
│  4. Find or create conversation                                  │
│  5. Store inbound message                                        │
│  6. Trigger n8n webhook (async)                                  │
│  7. Generate AI reply via GPT-4o                                 │
│  8. Send reply back via Meta API                                 │
│  9. Store outbound message in Supabase                           │
└──────┬──────────────────────────────┬───────────────────────────┘
       │ Supabase Realtime            │ n8n Webhook
       ▼                              ▼
┌──────────────────┐       ┌──────────────────────────────────────┐
│  SUPABASE        │       │  n8n AUTOMATION (Railway)            │
│  PostgreSQL DB   │       │  - Save to Google Sheets             │
│  Row Level Sec.  │       │  - Save to Airtable                  │
│  Realtime WS     │       │  - Notify owner                      │
│  Auth            │       │  - Custom workflows                  │
└──────────────────┘       └──────────────────────────────────────┘
       │ Realtime push
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  NEXT.JS FRONTEND  (Vercel)                                      │
│  Supabase Realtime subscription                                  │
│  Message appears in Conversations page INSTANTLY                 │
│  No polling — pure WebSocket push                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## PERMISSION GATING BY PLAN

The backend enforces plan limits at the webhook level:

| Feature              | Starter     | Growth      | Enterprise  |
|----------------------|-------------|-------------|-------------|
| Channels             | WhatsApp    | WA+IG+FB    | WA+IG+FB    |
| Conversations/month  | 500         | Unlimited   | Unlimited   |
| AI Agent             | 1           | 3           | Unlimited   |
| Human Handoff        | ✗           | ✓           | ✓           |
| Analytics            | Basic       | Advanced    | Advanced    |
| White-label          | ✗           | ✗           | ✓           |
| API Access           | ✗           | ✗           | ✓           |

To upgrade a client in admin panel:
1. Go to `/admin` → Tenants table
2. Change plan dropdown for that client → auto-saves

---

## TESTING THE FULL FLOW

1. Deploy backend and note the URL
2. Register your WhatsApp webhook in Meta Developer Console
3. Send a WhatsApp message to your test number
4. Watch the Conversations tab in real-time — message appears instantly
5. The AI agent auto-replies within 2-3 seconds
6. Check n8n executions to see the workflow triggered

---

## TROUBLESHOOTING

**Webhook not receiving messages:**
- Check META_VERIFY_TOKEN matches exactly in both .env and Meta Console
- Backend health: `curl https://your-backend.railway.app/health`
- Check Railway logs: `railway logs`

**Messages not appearing in real-time:**
- Check Supabase Realtime is enabled for `messages` table
- Check browser console for WebSocket errors
- Verify NEXT_PUBLIC_SUPABASE_URL is correct

**AI not replying:**
- Check OPENAI_API_KEY is valid
- Check agent `is_published = true` in database
- Check agent has the right channel in `channels` array

**n8n not triggering:**
- Check n8n webhook URL is set in tenant settings
- Check n8n workflow is activated (green toggle)
- Check n8n execution history for errors
