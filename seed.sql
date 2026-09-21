-- 1. Create Organization
INSERT INTO organizations (id, name, slug) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Acme Corp', 'acme-corp')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Application
INSERT INTO applications (id, organization_id, name, slug, environment, status, webhook_url) 
VALUES (
  '22222222-2222-2222-2222-222222222222', 
  '11111111-1111-1111-1111-111111111111', 
  'Acme E-commerce', 
  'acme-ecom',
  'live', 
  'active',
  'https://acme.com/webhook'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create Merchant
INSERT INTO merchants (id, organization_id, name, status, country_code, currency_code) 
VALUES ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Acme Payments', 'active', 'IN', 'INR')
ON CONFLICT (id) DO NOTHING;

-- 4. Create Merchant Provider (Connect Razorpay)
INSERT INTO merchant_providers (id, merchant_id, provider, is_active, is_default) 
VALUES ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'razorpay', true, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Create API Key
INSERT INTO api_keys (id, application_id, name, key_prefix, secret_hash, environment, status, permissions) 
VALUES (
  '55555555-5555-5555-5555-555555555555', 
  '22222222-2222-2222-2222-222222222222', 
  'Live Production Key', 
  'tk_live_12345678', 
  '73b45c6594594a70a5042c957052b38f0a6bf00166a0160d176a260547c6254f', 
  'live', 
  'active', 
  '["payment.create", "payment.get", "payment.list"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
