import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const serviceClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const tests = [
  ['admin@autoflow.ai', 'AutoFlow@Admin2026!'],
  ['demo@restaurant.com', 'Demo@1234!'],
];

for (const [email, password] of tests) {
  const anonResult = await anonClient.auth.signInWithPassword({ email, password });
  const serviceResult = await serviceClient.auth.signInWithPassword({ email, password });

  console.log('===', email, '===');
  console.log('ANON:', anonResult.error ? anonResult.error.message : `ok user=${anonResult.data.user?.id}`);
  console.log('SERVICE:', serviceResult.error ? serviceResult.error.message : `ok user=${serviceResult.data.user?.id}`);
}
