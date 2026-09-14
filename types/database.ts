// ============================================================
// Trim Key Flow — Database Types
// Generated from live Supabase schema (jaspyjriophxwkxexfcj)
// DO NOT EDIT manually — reflects actual table columns
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type ProviderType = 'razorpay' | 'cashfree' | 'phonepe'

export type ApiKeyEnvironment = 'test' | 'live'

export type ApiKeyStatus = 'active' | 'revoked' | 'expired'

export type ApplicationStatus = 'active' | 'inactive' | 'suspended'

export type MerchantStatus = 'active' | 'inactive' | 'suspended'

export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer'

export type OrganizationStatus = 'active' | 'inactive' | 'suspended'

// ── Table Row Types ───────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  job_title: string | null
  timezone: string | null
  country_code: string | null
  preferred_language: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  legal_name: string | null
  slug: string
  organization_type: string | null
  status: OrganizationStatus
  email: string | null
  phone: string | null
  website_url: string | null
  country_code: string | null
  currency_code: string | null
  timezone: string | null
  logo_url: string | null
  description: string | null
  tax_identifier: string | null
  registration_number: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: MemberRole
  is_active: boolean
  joined_at: string | null
  created_at: string
}

export interface Industry {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  is_active: boolean
  created_at: string
}

export interface OrganizationIndustry {
  organization_id: string
  industry_id: string
  is_primary: boolean
  created_at: string
}

export interface Application {
  id: string
  organization_id: string
  name: string
  slug: string
  description: string | null
  status: ApplicationStatus
  environment: string | null
  webhook_url: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ApplicationDomain {
  id: string
  application_id: string
  domain: string
  is_verified: boolean
  verification_token: string | null
  verified_at: string | null
  created_at: string
}

export interface ApiKey {
  id: string
  application_id: string
  name: string
  key_prefix: string
  secret_hash: string
  environment: ApiKeyEnvironment
  status: ApiKeyStatus
  permissions: string[] | null
  last_used_at: string | null
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}

export interface Merchant {
  id: string
  organization_id: string
  name: string
  display_name: string | null
  status: MerchantStatus
  country_code: string | null
  currency_code: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface MerchantProvider {
  id: string
  merchant_id: string
  provider: ProviderType
  account_identifier: string | null
  credentials_encrypted: EncryptedCredentials | null
  webhook_secret_encrypted: string | null
  is_active: boolean
  is_default: boolean
  connected_at: string | null
  disconnected_at: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface EncryptedCredentials {
  iv: string
  ciphertext: string
  tag: string
}

export interface Order {
  id: string
  order_number: string           // TKF-ORD-YYYYMMDD-NNNNNN
  application_id: string
  merchant_id: string
  merchant_provider_id: string
  amount: number
  currency_code: string
  purpose: string
  status: string                 // CREATED | PENDING | PROCESSING | SUCCESS | FAILED | EXPIRED
  provider_order_id: string | null
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  idempotency_key: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  expires_at: string | null
}

export interface Payment {
  id: string
  payment_number: string         // TKF-PAY-YYYYMMDD-NNNNNN
  order_id: string
  application_id: string
  merchant_id: string
  merchant_provider_id: string
  provider_payment_id: string | null
  amount: number
  currency_code: string
  payment_method: string | null
  status: string                 // CREATED | PENDING | PROCESSING | SUCCESS | FAILED | EXPIRED | REFUNDED | PARTIALLY_REFUNDED
  failure_code: string | null
  failure_reason: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  paid_at: string | null
}

export interface Refund {
  id: string
  refund_number: string          // TKF-REF-YYYYMMDD-NNNNNN
  payment_id: string
  amount: number
  currency_code: string
  provider_refund_id: string | null
  status: string                 // PENDING | PROCESSING | SUCCESS | FAILED
  reason: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface WebhookEvent {
  id: string
  provider: ProviderType
  provider_event_id: string
  event_type: string
  signature_valid: boolean
  payload: Record<string, unknown>
  processed: boolean
  processing_error: string | null
  received_at: string
  processed_at: string | null
}

export interface WebhookDelivery {
  id: string
  webhook_event_id: string
  application_id: string
  endpoint_url: string
  event_type: string
  attempt_number: number
  http_status: number | null
  response_body: string | null
  status: string                 // PENDING | SUCCESS | FAILED | RETRYING
  next_retry_at: string | null
  delivered_at: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  organization_id: string | null
  user_id: string | null
  application_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ── Insert Types (omit auto-generated fields) ─────────────────

export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at'>
export type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'>
export type RefundInsert = Omit<Refund, 'id' | 'created_at' | 'updated_at'>
export type WebhookEventInsert = Omit<WebhookEvent, 'id'>
export type WebhookDeliveryInsert = Omit<WebhookDelivery, 'id' | 'created_at'>
export type AuditLogInsert = Omit<AuditLog, 'id' | 'created_at'>
