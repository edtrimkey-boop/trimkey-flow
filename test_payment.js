const fs = require('fs');
async function testPayment() {
    let html = fs.readFileSync('merchant-demo.html', 'utf8');
    let apiKey = html.match(/const TRIM_KEY_API_KEY = "(.*?)";/)[1];
    let merchantId = html.match(/merchant_id: "(.*?)"/)[1];
    
    const response = await fetch('http://localhost:3000/api/v1', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            action: "payment.create",
            data: {
                merchant_id: merchantId,
                amount: 150000,
                currency: "INR",
                purpose: "Nike Air Max 2026",
                customer: {
                    name: "Demo Customer",
                    email: "demo@example.com",
                    phone: "9999999999"
                }
            }
        })
    });
    
    console.log(response.status);
    console.log(await response.text());
}
testPayment();
