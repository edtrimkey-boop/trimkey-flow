-- =========================================================
-- TRIM KEY FLOW
-- Multi-Tenant SaaS + Payment Infrastructure
-- Supabase PostgreSQL
-- =========================================================

create extension if not exists pgcrypto;


-- =========================================================
-- ENUMS
-- =========================================================

create type public.organization_status as enum (
    'active',
    'suspended',
    'pending',
    'archived'
);

create type public.member_role as enum (
    'owner',
    'admin',
    'developer',
    'finance',
    'support',
    'viewer'
);

create type public.application_status as enum (
    'active',
    'suspended',
    'archived'
);

create type public.api_key_environment as enum (
    'test',
    'live'
);

create type public.api_key_status as enum (
    'active',
    'revoked',
    'expired'
);

create type public.merchant_status as enum (
    'active',
    'inactive',
    'pending',
    'suspended'
);

create type public.provider_type as enum (
    'razorpay',
    'cashfree',
    'phonepe'
);


-- =========================================================
-- PROFILES
-- Connected to Supabase auth.users
-- =========================================================

create table public.profiles (
    id uuid primary key
        references auth.users(id)
        on delete cascade,

    full_name text,

    phone text,

    avatar_url text,

    job_title text,

    timezone text default 'Asia/Kolkata',

    country_code text default 'IN',

    preferred_language text default 'en',

    is_active boolean not null default true,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- =========================================================
-- ORGANIZATIONS
-- Companies / schools / institutes / businesses / agencies
-- =========================================================

create table public.organizations (
    id uuid primary key default gen_random_uuid(),

    name text not null,

    legal_name text,

    slug text not null unique,

    organization_type text,

    status public.organization_status
        not null default 'pending',

    email text,

    phone text,

    website_url text,

    country_code text default 'IN',

    currency_code text default 'INR',

    timezone text default 'Asia/Kolkata',

    logo_url text,

    description text,

    tax_identifier text,

    registration_number text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- =========================================================
-- INDUSTRIES
-- =========================================================

create table public.industries (
    id uuid primary key default gen_random_uuid(),

    name text not null unique,

    slug text not null unique,

    description text,

    parent_id uuid
        references public.industries(id)
        on delete set null,

    is_active boolean not null default true,

    created_at timestamptz not null default now()
);


-- =========================================================
-- ORGANIZATION ↔ INDUSTRY
-- Many-to-many
-- =========================================================

create table public.organization_industries (
    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    industry_id uuid not null
        references public.industries(id)
        on delete cascade,

    is_primary boolean not null default false,

    created_at timestamptz not null default now(),

    primary key (organization_id, industry_id)
);


-- =========================================================
-- ORGANIZATION MEMBERS
-- User ↔ Organization
-- =========================================================

create table public.organization_members (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    user_id uuid not null
        references public.profiles(id)
        on delete cascade,

    role public.member_role not null default 'viewer',

    is_active boolean not null default true,

    joined_at timestamptz not null default now(),

    created_at timestamptz not null default now(),

    unique (organization_id, user_id)
);


-- =========================================================
-- APPLICATIONS
-- Software using Trim Key Flow
-- =========================================================

create table public.applications (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    name text not null,

    slug text not null,

    description text,

    status public.application_status
        not null default 'active',

    environment text
        not null default 'live',

    webhook_url text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    unique (organization_id, slug)
);


-- =========================================================
-- APPLICATION DOMAINS
-- =========================================================

create table public.application_domains (
    id uuid primary key default gen_random_uuid(),

    application_id uuid not null
        references public.applications(id)
        on delete cascade,

    domain text not null,

    is_verified boolean not null default false,

    verification_token text,

    verified_at timestamptz,

    created_at timestamptz not null default now(),

    unique (application_id, domain)
);


-- =========================================================
-- API KEYS
-- Never store the raw secret
-- =========================================================

create table public.api_keys (
    id uuid primary key default gen_random_uuid(),

    application_id uuid not null
        references public.applications(id)
        on delete cascade,

    name text not null,

    key_prefix text not null,

    secret_hash text not null,

    environment public.api_key_environment
        not null default 'live',

    status public.api_key_status
        not null default 'active',

    permissions jsonb not null default '[]'::jsonb,

    last_used_at timestamptz,

    expires_at timestamptz,

    revoked_at timestamptz,

    created_at timestamptz not null default now()
);


-- =========================================================
-- MERCHANTS
-- Payment receiving entities
-- =========================================================

create table public.merchants (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid not null
        references public.organizations(id)
        on delete cascade,

    name text not null,

    display_name text,

    status public.merchant_status
        not null default 'pending',

    country_code text default 'IN',

    currency_code text default 'INR',

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);


-- =========================================================
-- MERCHANT PROVIDERS
-- Connect merchant to Razorpay/Cashfree/PhonePe
-- =========================================================

create table public.merchant_providers (
    id uuid primary key default gen_random_uuid(),

    merchant_id uuid not null
        references public.merchants(id)
        on delete cascade,

    provider public.provider_type not null,

    account_identifier text,

    credentials_encrypted jsonb,

    webhook_secret_encrypted text,

    is_active boolean not null default false,

    is_default boolean not null default false,

    connected_at timestamptz,

    disconnected_at timestamptz,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    unique (merchant_id, provider)
);


-- =========================================================
-- ORDERS
-- =========================================================

create table public.orders (
    id uuid primary key default gen_random_uuid(),

    order_number text not null unique,

    application_id uuid not null
        references public.applications(id)
        on delete restrict,

    merchant_id uuid not null
        references public.merchants(id)
        on delete restrict,

    merchant_provider_id uuid
        references public.merchant_providers(id)
        on delete set null,

    amount numeric(14,2) not null
        check (amount > 0),

    currency_code text not null default 'INR',

    purpose text,

    status text not null default 'created',

    provider_order_id text,

    customer_name text,

    customer_email text,

    customer_phone text,

    idempotency_key text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    expires_at timestamptz,

    unique (application_id, idempotency_key)
);


-- =========================================================
-- PAYMENTS
-- One order can have multiple payment attempts
-- =========================================================

create table public.payments (
    id uuid primary key default gen_random_uuid(),

    payment_number text not null unique,

    order_id uuid not null
        references public.orders(id)
        on delete restrict,

    application_id uuid not null
        references public.applications(id)
        on delete restrict,

    merchant_id uuid not null
        references public.merchants(id)
        on delete restrict,

    merchant_provider_id uuid
        references public.merchant_providers(id)
        on delete set null,

    provider_payment_id text,

    amount numeric(14,2) not null
        check (amount > 0),

    currency_code text not null default 'INR',

    payment_method text,

    status text not null default 'pending',

    failure_code text,

    failure_reason text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    paid_at timestamptz
);


-- =========================================================
-- REFUNDS
-- =========================================================

create table public.refunds (
    id uuid primary key default gen_random_uuid(),

    refund_number text not null unique,

    payment_id uuid not null
        references public.payments(id)
        on delete restrict,

    amount numeric(14,2) not null
        check (amount > 0),

    currency_code text not null default 'INR',

    provider_refund_id text,

    status text not null default 'requested',

    reason text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    completed_at timestamptz
);


-- =========================================================
-- WEBHOOK EVENTS
-- Provider → Flow
-- =========================================================

create table public.webhook_events (
    id uuid primary key default gen_random_uuid(),

    provider public.provider_type not null,

    provider_event_id text not null,

    event_type text not null,

    signature_valid boolean not null default false,

    payload jsonb not null,

    processed boolean not null default false,

    processing_error text,

    received_at timestamptz not null default now(),

    processed_at timestamptz,

    unique (provider, provider_event_id)
);


-- =========================================================
-- WEBHOOK DELIVERIES
-- Flow → Application
-- =========================================================

create table public.webhook_deliveries (
    id uuid primary key default gen_random_uuid(),

    webhook_event_id uuid
        references public.webhook_events(id)
        on delete set null,

    application_id uuid not null
        references public.applications(id)
        on delete cascade,

    endpoint_url text not null,

    event_type text not null,

    attempt_number integer not null default 1,

    http_status integer,

    response_body text,

    status text not null default 'pending',

    next_retry_at timestamptz,

    delivered_at timestamptz,

    created_at timestamptz not null default now()
);


-- =========================================================
-- AUDIT LOGS
-- =========================================================

create table public.audit_logs (
    id uuid primary key default gen_random_uuid(),

    organization_id uuid
        references public.organizations(id)
        on delete set null,

    user_id uuid
        references public.profiles(id)
        on delete set null,

    application_id uuid
        references public.applications(id)
        on delete set null,

    action text not null,

    resource_type text,

    resource_id uuid,

    ip_address inet,

    user_agent text,

    metadata jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now()
);

-- Organization
create index idx_organization_members_user
on public.organization_members(user_id);

create index idx_organization_members_org
on public.organization_members(organization_id);

create index idx_organization_industries_industry
on public.organization_industries(industry_id);


-- Applications
create index idx_applications_organization
on public.applications(organization_id);

create index idx_application_domains_application
on public.application_domains(application_id);


-- Merchants
create index idx_merchants_organization
on public.merchants(organization_id);

create index idx_merchant_providers_merchant
on public.merchant_providers(merchant_id);


-- Orders
create index idx_orders_application
on public.orders(application_id);

create index idx_orders_merchant
on public.orders(merchant_id);

create index idx_orders_status
on public.orders(status);

create index idx_orders_created_at
on public.orders(created_at);


-- Payments
create index idx_payments_order
on public.payments(order_id);

create index idx_payments_application
on public.payments(application_id);

create index idx_payments_merchant
on public.payments(merchant_id);

create index idx_payments_status
on public.payments(status);

create index idx_payments_created_at
on public.payments(created_at);


-- Webhooks
create index idx_webhook_events_processed
on public.webhook_events(processed);

create index idx_webhook_events_received
on public.webhook_events(received_at);

create index idx_webhook_deliveries_application
on public.webhook_deliveries(application_id);


-- Audit
create index idx_audit_logs_organization
on public.audit_logs(organization_id);

create index idx_audit_logs_created
on public.audit_logs(created_at);

insert into public.industries
(name, slug, description)
values

('Education', 'education',
 'Schools, colleges, coaching institutes and education providers'),

('EdTech', 'edtech',
 'Technology companies operating in education'),

('Software', 'software',
 'Software and technology companies'),

('SaaS', 'saas',
 'Software as a Service businesses'),

('E-commerce', 'ecommerce',
 'Online commerce and retail businesses'),

('Healthcare', 'healthcare',
 'Healthcare providers and technology businesses'),

('Financial Services', 'financial-services',
 'Financial and financial technology businesses'),

('Hospitality', 'hospitality',
 'Hotels, restaurants and hospitality businesses'),

('Professional Services', 'professional-services',
 'Consulting, agencies and professional service businesses'),

('Retail', 'retail',
 'Physical and digital retail businesses'),

('Non-Profit', 'non-profit',
 'Non-profit organizations'),

('Other', 'other',
 'Other industries');