const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function getCredentials() {
    const { data: keys } = await db.from('api_keys').select('*').limit(1);
    const { data: merchants } = await db.from('merchants').select('*').limit(1);
    
    let html = fs.readFileSync('merchant-demo.html', 'utf8');
    html = html.replace(/const TRIM_KEY_API_KEY = ".*?";/, 'const TRIM_KEY_API_KEY = "' + keys[0].key + '";');
    html = html.replace(/merchant_id: ".*?"/, 'merchant_id: "' + merchants[0].id + '"');
    
    fs.writeFileSync('merchant-demo.html', html);
    console.log("Updated merchant-demo.html with active credentials!");
}
getCredentials();
