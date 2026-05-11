const axios = require('axios');

// --- CONFIGURATION ---
const BACKEND_URL = 'http://localhost:3001'; // Change to your Railway URL if testing production
const CHANNEL = 'whatsapp'; // whatsapp, instagram, or facebook
const VERIFY_TOKEN = 'autoflow_webhook_verify_2026';

// --- TEST DATA ---
const mockWebhookPayload = {
  object: 'whatsapp_business_account',
  entry: [{
    id: '123456789',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: { display_phone_number: '1234567890', phone_number_id: 'YOUR_PHONE_NUMBER_ID' }, // UPDATE THIS
        contacts: [{ profile: { name: 'Test User' }, wa_id: '1234567890' }],
        messages: [{
          from: '1234567890',
          id: 'wamid.HBgLMTIzNDU2Nzg5MFYDVDRGRDU2RDU2RDVF',
          timestamp: '1623456789',
          text: { body: 'Hello from test script!' },
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
