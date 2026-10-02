const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
    const { data: keys } = await db.from('api_keys').select('*').limit(2);
    const { data: merchants } = await db.from('merchants').select('*').limit(2);
    console.log("Keys org:", keys[0].organization_id);
    console.log("Merchant org:", merchants[0].organization_id);
}
test();
