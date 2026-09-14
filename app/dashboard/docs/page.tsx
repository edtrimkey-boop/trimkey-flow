export default function DocsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-white">API Documentation</h1>
        <p className="text-gray-400 mt-2">Trim Key Flow V1 — Payment Infrastructure API</p>
      </div>

      <div className="space-y-8">
        {/* Introduction */}
        <Section title="Introduction">
          <p className="text-gray-300 text-sm leading-relaxed">
            Trim Key Flow provides a single, stable API endpoint for all payment operations.
            Client applications (like Ed-Trim Key) interact with Trim Key Flow using API keys.
            Flow abstracts the underlying payment provider (Razorpay) so that your application
            code never needs to change when providers change.
          </p>
          <div className="mt-3 bg-gray-800 rounded-lg px-4 py-3 text-sm font-mono text-indigo-300">
            POST https://flow.trimkey.in/api/v1
          </div>
        </Section>

        {/* Authentication */}
        <Section title="Authentication">
          <p className="text-gray-400 text-sm mb-3">Every request requires a bearer token:</p>
          <Code>{`Authorization: Bearer tk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</Code>
          <p className="text-gray-500 text-xs mt-2">Keys are created via the <code className="text-indigo-400">api_key.create</code> action. The full secret is shown only once.</p>
        </Section>

        {/* Request Format */}
        <Section title="Request Format">
          <p className="text-gray-400 text-sm mb-3">All requests use the same structure:</p>
          <Code>{`{
  "action": "payment.create",
  "data": { ... }
}`}</Code>
          <p className="text-gray-400 text-sm mt-3 mb-2">Optional headers:</p>
          <Code>{`Idempotency-Key: unique-client-request-id
X-Request-ID: req_custom123`}</Code>
        </Section>

        {/* Create Payment */}
        <Section title="Create Payment">
          <p className="text-gray-400 text-sm mb-3">Create a payment order and get Razorpay checkout information:</p>
          <Code>{`curl -X POST https://flow.trimkey.in/api/v1 \\
  -H "Authorization: Bearer tk_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: sub-renewal-abc123" \\
  -d '{
    "action": "payment.create",
    "data": {
      "amount": 8000,
      "currency": "INR",
      "merchant_id": "uuid-of-merchant",
      "purpose": "SUBSCRIPTION_RENEWAL",
      "customer": {
        "name": "Institute Admin",
        "email": "admin@example.com",
        "phone": "9876543210"
      },
      "metadata": {
        "subscription_id": "sub_123"
      }
    }
  }'`}</Code>
          <p className="text-gray-400 text-sm mt-3 mb-2">Response:</p>
          <Code>{`{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "payment_number": "TKF-PAY-20260914-000001",
    "order_id": "uuid",
    "order_number": "TKF-ORD-20260914-000001",
    "provider": "razorpay",
    "provider_order_id": "order_xxxxxxxxxx",
    "amount": 8000,
    "currency": "INR",
    "key_id": "rzp_test_xxxxxxxxxx",
    "status": "PENDING"
  },
  "request_id": "req_xxxxxxxx"
}`}</Code>
        </Section>

        {/* Payment Status */}
        <Section title="Payment Status">
          <Code>{`// Get payment by Flow ID or TKF-PAY-* number
{
  "action": "payment.get",
  "data": { "payment_id": "TKF-PAY-20260914-000001" }
}`}</Code>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {['CREATED','PENDING','PROCESSING','SUCCESS','FAILED','EXPIRED','REFUNDED','PARTIALLY_REFUNDED'].map(s => (
              <div key={s} className="bg-gray-800 rounded px-2 py-1 text-gray-300 font-mono">{s}</div>
            ))}
          </div>
        </Section>

        {/* Refunds */}
        <Section title="Refunds">
          <p className="text-gray-400 text-sm mb-3">Full and partial refunds supported:</p>
          <Code>{`{
  "action": "refund.create",
  "data": {
    "payment_id": "TKF-PAY-20260914-000001",
    "amount": 2000,
    "reason": "Customer requested refund"
  }
}`}</Code>
        </Section>

        {/* Webhooks */}
        <Section title="Webhooks">
          <p className="text-gray-400 text-sm mb-3">Configure your application webhook URL in the Applications dashboard. Flow sends events to your endpoint:</p>
          <Code>{`// payment.succeeded event
{
  "event": "payment.succeeded",
  "id": "evt_xxxxxxxx",
  "payment": {
    "id": "uuid",
    "payment_number": "TKF-PAY-20260914-000001",
    "order_id": "uuid",
    "order_number": "TKF-ORD-20260914-000001",
    "amount": 8000,
    "currency": "INR",
    "status": "SUCCESS",
    "provider": "razorpay",
    "provider_payment_id": "pay_xxxxxxxxxx",
    "paid_at": "2026-09-14T11:00:00.000Z"
  },
  "timestamp": "2026-09-14T11:00:00.000Z"
}`}</Code>
        </Section>

        {/* Razorpay Webhook */}
        <Section title="Razorpay Webhook Configuration">
          <p className="text-gray-400 text-sm mb-3">Configure this URL in your Razorpay dashboard:</p>
          <Code>{`https://flow.trimkey.in/api/webhooks/razorpay`}</Code>
          <p className="text-gray-400 text-sm mt-3">Events to enable: <code className="text-indigo-400">payment.captured</code>, <code className="text-indigo-400">payment.failed</code>, <code className="text-indigo-400">refund.processed</code></p>
        </Section>

        {/* Error Codes */}
        <Section title="Error Codes">
          <Code>{`{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key"
  },
  "request_id": "req_xxxxxxxx"
}`}</Code>
          <div className="mt-3 grid grid-cols-1 gap-1 text-xs">
            {[
              ['UNAUTHORIZED', '401', 'Invalid or missing API key'],
              ['FORBIDDEN', '403', 'Permission denied'],
              ['INVALID_REQUEST', '400', 'Validation error'],
              ['MERCHANT_NOT_FOUND', '404', 'Merchant not found or unauthorized'],
              ['PROVIDER_NOT_CONFIGURED', '400', 'No active provider for merchant'],
              ['DUPLICATE_REQUEST', '409', 'Idempotency key already used'],
              ['PAYMENT_NOT_REFUNDABLE', '400', 'Payment cannot be refunded'],
              ['OVER_REFUND', '400', 'Refund exceeds refundable amount'],
              ['PROVIDER_ERROR', '502', 'Razorpay error'],
            ].map(([code, status, desc]) => (
              <div key={code} className="bg-gray-800 rounded px-3 py-1.5 flex gap-4">
                <span className="text-red-400 font-mono w-44 flex-shrink-0">{code}</span>
                <span className="text-gray-500 w-8">{status}</span>
                <span className="text-gray-400">{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* All Actions */}
        <Section title="All API Actions">
          <div className="grid grid-cols-2 gap-1 text-xs">
            {[
              'payment.create','payment.get','payment.list',
              'order.get','order.list',
              'refund.create','refund.get',
              'transaction.get','transaction.list',
              'merchant.get','merchant.list',
              'application.get','application.list',
              'api_key.create','api_key.revoke',
              'domain.create','domain.delete',
            ].map(action => (
              <div key={action} className="bg-gray-800 rounded px-2 py-1 text-indigo-400 font-mono">{action}</div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-white font-semibold text-lg mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto leading-relaxed">
      {children}
    </pre>
  )
}
