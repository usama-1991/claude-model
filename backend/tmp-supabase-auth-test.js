const { createRequire } = require('module');
const require = createRequire(import.meta.url);
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
(async () => {
  const tests = [
    ['admin@autoflow.ai', 'AutoFlow@Admin2026!'],
    ['demo@restaurant.com', 'Demo@1234!'],
  ];
  for (const [email, password] of tests) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('TEST', email, '=>', error ? {
      status: error.status,
      message: error.message,
      details: error?.details,
      hint: error?.hint,
    } : {
      userId: data.user?.id,
      sessionStartsWith: data.session?.access_token?.slice(0, 10),
    });
  }
})();