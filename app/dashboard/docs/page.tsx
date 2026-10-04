export default function DocsPage() {
  return (
    <div className="tk-table-wrapper" style={{ maxWidth: '900px' }}>
      <div className="panel-header">
        <h1 style={{ color: 'white', fontWeight: 800, fontSize: '20px' }}>API Documentation</h1>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>Trim Key Flow V1 â€” Payment Infrastructure API</p>
      </div>

      <div className="space-y-8">
        {/* Introduction */}
        <Section title="Introduction">
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
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
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Every request requires a bearer token:</p>
          <Code>{`Authorization: Bearer tk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}</Code>
          <p className="text-gray-500 text-xs mt-2">Keys are created via the <code className="text-indigo-400">api_key.create</code> action. The full secret is shown only once.</p>
        </Section>

        {/* Request Format */}
        <Section title="Request Format">
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>All requests use the same structure:</p>
          <Code>{`{
  "action": "payment.create",
  "data": { ... }
}`}</Code>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '15px', marginBottom: '10px' }}>Optional headers:</p>
          <Code>{`Idempotency-Key: unique-client-request-id
X-Request-ID: req_custom123`}</Code>
        </Section>

        {/* Create Payment */}
        <Section title="Create Payment">
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Create a payment order and get Razorpay checkout information:</p>
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
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '15px', marginBottom: '10px' }}>Response:</p>
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
              <div key={s} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>{s}</div>
            ))}
          </div>
        </Section>

        {/* Refunds */}
        <Section title="Refunds">
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Full and partial refunds supported:</p>
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
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Configure your application webhook URL in the Applications dashboard. Flow sends events to your endpoint:</p>
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
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Configure this URL in your Razorpay dashboard:</p>
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
              <div key={code} style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px' }}>
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
              <div key={action} style={{ background: 'rgba(0, 251, 166, 0.05)', color: 'var(--brand)', padding: '4px 8px', borderRadius: '4px' }}>{action}</div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel" style={{ marginBottom: '20px', padding: '20px' }}>
      <h2 style={{ color: 'white', fontWeight: 800, fontSize: '14px', marginBottom: '15px' }}>{title}</h2>
      {children}
    </div>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="tk-input" style={{ padding: '15px', overflowX: 'auto', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '11px', color: 'var(--brand)' }}>
      {children}
    </pre>
  )
}

