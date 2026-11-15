# Trim Key Flow

**Payment Infrastructure & Orchestration Platform**

Trim Key Flow abstracts payment providers from client applications. Clients send a single structured API request; Flow handles provider routing, authentication, idempotency, webhooks, and audit logs.

```
Client Application (Ed-Trim Key)
         │ POST /api/v1
         ▼
Trim Key Flow
         │
         ▼
Razorpay Adapter
         │
         ▼
Razorpay → Customer pays
         │
         ▼
Razorpay Webhook → Trim Key Flow → Application Webhook → Ed-Trim Key
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 15 App Router |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Payment | Razorpay (V1) |
| Hosting | Vercel |
| Language | TypeScript (strict) |

---

## Architecture

```
app/
  api/v1/route.ts          ← Single public API endpoint
  api/webhooks/razorpay/   ← Provider webhook handler
  dashboard/               ← Internal dashboard
providers/
  types.ts                 ← PaymentProvider interface
  razorpay/adapter.ts      ← Razorpay implementation
services/                  ← Business logic layer
lib/                       ← Auth, encryption, validation
types/                     ← Database + API types
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env.local
# Fill in Supabase credentials + Razorpay test keys

# 3. Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Set as FLOW_ENCRYPTION_KEY in .env.local

# 4. Start dev server
npm run dev
```

The app runs at: http://localhost:3000  
API endpoint: http://localhost:3000/api/v1

---

## Environment Variables

See `.env.example` for all required variables.

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) |
| `FLOW_ENCRYPTION_KEY` | AES-256-GCM key for merchant credentials (server-only) |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret (server-only) |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook HMAC secret (server-only) |

---

## API Authentication

Applications authenticate with API keys:

```http
Authorization: Bearer tk_live_xxxxxxxxxx...
```

Keys are created via the `api_key.create` action. The full secret is shown **once** and never stored.

---

## API Usage

All requests go to `POST /api/v1`:

```bash
# Create a payment
curl -X POST https://flow.trimkey.in/api/v1 \
  -H "Authorization: Bearer tk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: subscription-renewal-abc123" \
  -d '{
    "action": "payment.create",
    "data": {
      "amount": 8000,
      "currency": "INR",
      "merchant_id": "merchant_uuid",
      "purpose": "SUBSCRIPTION_RENEWAL",
      "customer": {
        "name": "Institute Admin",
        "email": "admin@school.in",
        "phone": "9876543210"
      }
    }
  }'
```

### Available Actions

```
payment.create / payment.get / payment.list
order.get / order.list
refund.create / refund.get
transaction.get / transaction.list
merchant.get / merchant.list
application.get / application.list
api_key.create / api_key.revoke
domain.create / domain.delete
```

---

## Multi-Tenant BYOG & Webhook Architecture

Trim Key Flow operates on a **BYOG (Bring Your Own Gateway)** model. Each merchant connects their own gateway account (e.g. Razorpay) so funds settle directly into their own bank account.

> 📖 **Full Architecture & Implementation Guide:** See [docs/BYOG_AND_WEBHOOKS.md](docs/BYOG_AND_WEBHOOKS.md) for detailed diagrams, file indexes, and reliability flows.

### Highlights:
1. **Zero Environment Variables per Tenant:** All merchant gateway keys and webhook secrets are stored encrypted (AES-256-GCM) in the PostgreSQL database. Adding 100 businesses requires zero `.env` changes or redeployments.
2. **Automated Webhook Registration:** When a merchant inputs their credentials, Trim Key Flow automatically registers `https://flow.trimkey.in/api/webhooks/razorpay` in their Razorpay account via API.
3. **3-Tier Payment Reliability:**
   - **Tier 1 (Client):** Instant UI checkmark via frontend SDK callback.
   - **Tier 2 (Cloud Webhook):** Cloud-to-cloud server webhook independent of customer device, battery, or network status.
   - **Tier 3 (Active Reconciliation):** On checkout reload or background cron job, Flow queries Razorpay's `orders.fetchPayments` directly to recover payments even if the user's laptop shut down mid-transaction.

---

## Webhook Architecture

**Inbound (Gateways → Trim Key Flow):**
```
POST /api/webhooks/razorpay
```
Universal endpoint for all merchants. Flow dynamically resolves the merchant and decrypts their webhook secret to verify HMAC signatures.
Events: `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`

**Outbound (Trim Key Flow → Client Applications):**

Set `webhook_url` on your Application record. Flow delivers:
```json
{
  "event": "payment.success",
  "id": "evt_xxxxx",
  "payment_number": "TKF-PAY-20261115-000008",
  "amount": 100,
  "currency": "INR",
  "provider_payment_id": "pay_xxxxxxxx",
  "provider_order_id": "order_xxxxxxxx",
  "timestamp": "..."
}
```
Failed deliveries are automatically queued and retried with exponential backoff (30s, 2m, 8m, 32m).

---

## Security

- API key secrets: SHA-256 hashed, never stored in plaintext
- Merchant credentials: AES-256-GCM encrypted at rest
- Webhook signatures: HMAC-SHA256 with constant-time comparison
- Amount verification: Provider amount validated against internal order before marking SUCCESS
- Session auth: Supabase Auth for dashboard (not API keys)
- Server secrets: Never exposed via `NEXT_PUBLIC_*` variables

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set production environment variables in Vercel Dashboard
# Project > Settings > Environment Variables
```

Required Vercel env vars: all variables from `.env.example` (not `NEXT_PUBLIC_*` prefixes need to be server-only).

---

## Database

Supabase PostgreSQL with 16 tables:

`profiles` · `organizations` · `organization_members` · `applications` · `application_domains` · `api_keys` · `merchants` · `merchant_providers` · `orders` · `payments` · `refunds` · `webhook_events` · `webhook_deliveries` · `audit_logs` · `industries` · `organization_industries`

---

## Flow IDs

| Type | Format | Example |
|---|---|---|
| Order | `TKF-ORD-YYYYMMDD-NNNNNN` | `TKF-ORD-20260914-000001` |
| Payment | `TKF-PAY-YYYYMMDD-NNNNNN` | `TKF-PAY-20260914-000001` |
| Refund | `TKF-REF-YYYYMMDD-NNNNNN` | `TKF-REF-20260914-000001` |
| Request | `req_<timestamp><random>` | `req_m9k2abc123def456` |

---

## GitHub Workflow

```bash
git status
git add .
git commit -m "descriptive message"
git push
```

Never commit `.env`, `.env.local`, or any file containing secrets.

---

*Trim Key Flow V1 — Built for Ed-Trim Key*
