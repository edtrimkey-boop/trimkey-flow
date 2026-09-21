-- ============================================================================
-- Trim Key Flow - Smart Routing Engine Migration
-- ============================================================================

-- Add 'stripe' to the provider ENUM if it doesn't exist
ALTER TYPE public.provider_type ADD VALUE IF NOT EXISTS 'stripe';

-- Create the routing rules table
CREATE TABLE IF NOT EXISTS public.routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    priority INTEGER NOT NULL DEFAULT 100, -- Lower number = higher priority
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Rule conditions
    condition_currency VARCHAR(3), -- e.g. 'USD', 'INR'. If null, applies to all
    condition_min_amount BIGINT, -- in base units (paise/cents)
    condition_max_amount BIGINT,
    
    -- The target provider if conditions are met
    target_provider_id UUID NOT NULL REFERENCES public.merchant_providers(id) ON DELETE CASCADE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.routing_rules ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE public.routing_rules TO postgres, anon, authenticated, service_role;

-- Insert a Mock Stripe Provider for our test merchant
INSERT INTO public.merchant_providers (
    id, merchant_id, provider, credentials_encrypted, is_active, is_default
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    'stripe',
    null,
    true,
    false
);

-- Insert a Mock Cashfree Provider for our test merchant
INSERT INTO public.merchant_providers (
    id, merchant_id, provider, credentials_encrypted, is_active, is_default
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    '33333333-3333-3333-3333-333333333333',
    'cashfree',
    null,
    true,
    false
);

-- Create Routing Rules for our Test Merchant
-- Rule 1: International Route (USD) -> Stripe (Priority 10)
INSERT INTO public.routing_rules (merchant_id, name, priority, condition_currency, target_provider_id)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'International Traffic -> Stripe',
    10,
    'USD',
    '55555555-5555-5555-5555-555555555555' -- Stripe Provider ID
);

-- Rule 2: High Value Domestic (INR > 50,000) -> Cashfree (Priority 20)
INSERT INTO public.routing_rules (merchant_id, name, priority, condition_currency, condition_min_amount, target_provider_id)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'High Value INR -> Cashfree',
    20,
    'INR',
    5000000, -- 50,000.00 INR
    '66666666-6666-6666-6666-666666666666' -- Cashfree Provider ID
);

-- Rule 3: Domestic Fallback (All other INR) -> Razorpay (Priority 30)
INSERT INTO public.routing_rules (merchant_id, name, priority, condition_currency, target_provider_id)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Default Domestic -> Razorpay',
    30,
    'INR',
    '44444444-4444-4444-4444-444444444444' -- Existing Razorpay Provider ID
);
