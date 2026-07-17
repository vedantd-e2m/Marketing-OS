const { supabaseAdmin } = require('./dist/utils/supabase.js');
supabaseAdmin.from('users').select('*').then(console.log).catch(console.error);
