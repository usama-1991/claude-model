const axios = require('axios');

// --- CONFIGURATION ---
const BACKEND_URL = 'https://claude-model-production.up.railway.app'; // Production URL
const CHANNEL = 'whatsapp';
const VERIFY_TOKEN = 'autoflow_webhook_verify_2026';

// --- TEST DATA ---
const mockWebhookPayload = {
  object: 'whatsapp_business_account',
  entry: [{
    id: '123456789',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: { display_phone_number: '1234567890', phone_number_id: '1081880905011541' }, // User's actual phone ID
        contacts: [{ profile: { name: 'Test User via Script' }, wa_id: '923000000000' }],
        messages: [{
          from: '923000000000',
          id: 'wamid.HBgLMTIzNDU2Nzg5MFYDVDRGRDU2RDU2RDVF' + Math.floor(Math.random() * 10000), // Randomize ID to avoid dedup
          timestamp: Math.floor(Date.now() / 1000).toString(),
          text: { body: 'Hello from backend test script! If you see this, the webhook is working perfectly.' },
          type: 'text'
        }]
      },
      field: 'messages'
    }]
  }]
};

async function runTests() {
  console.log('🚀 Starting Meta Webhook Integration Tests...\n');

  // 1. Test Verification (GET)
  try {
    console.log('📡 Testing Webhook Verification (GET)...');
    const verifyRes = await axios.get(`${BACKEND_URL}/api/webhook/${CHANNEL}`, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': '123456789'
      }
    });
    if (verifyRes.data === 123456789) {
      console.log('✅ Verification Successful!\n');
    } else {
      console.log('❌ Verification failed (wrong challenge response)\n');
    }
  } catch (err) {
    console.error('❌ Verification failed:', err.message, '\n');
  }

  // 2. Test Message Inbound (POST)
  try {
    console.log('📥 Testing Inbound Message (POST)...');
    const postRes = await axios.post(`${BACKEND_URL}/api/webhook/${CHANNEL}`, mockWebhookPayload);
    if (postRes.status === 200) {
      console.log('✅ Inbound Message Received by Backend!');
      console.log('Check your backend logs to see if it processed the message and contacted OpenAI.\n');
    }
  } catch (err) {
    console.error('❌ Message test failed:', err.message, '\n');
  }
}

runTests();
