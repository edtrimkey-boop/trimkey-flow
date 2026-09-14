// ============================================================
// Trim Key Flow — API Types
// Single-endpoint action-based API shapes
// ============================================================

// ── Request / Response Envelope ──────────────────────────────

export interface FlowRequest {
  action: FlowAction
  data: Record<string, unknown>
}

export interface FlowResponse<T = unknown> {
  success: true
  data: T
  request_id: string
}

export interface FlowErrorResponse {
  success: false
  error: {
    code: string
    message: string
  }
  request_id: string
}

// ── Actions ───────────────────────────────────────────────────

export type FlowAction =
  | 'payment.create'
  | 'payment.get'
  | 'payment.list'
  | 'order.get'
  | 'order.list'
  | 'refund.create'
  | 'refund.get'
  | 'transaction.get'
  | 'transaction.list'
  | 'merchant.get'
  | 'merchant.list'
  | 'application.get'
  | 'application.list'
  | 'api_key.create'
  | 'api_key.revoke'
  | 'domain.create'
  | 'domain.delete'

// ── Payment Action Payloads ───────────────────────────────────

export interface CreatePaymentData {
  amount: number
  currency: string
  merchant_id: string
  purpose: string
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  metadata?: Record<string, unknown>
}

export interface GetPaymentData {
  payment_id: string
}

export interface ListPaymentsData {
  merchant_id?: string
  status?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

// ── Order Action Payloads ─────────────────────────────────────

export interface GetOrderData {
  order_id: string
}

export interface ListOrdersData {
  merchant_id?: string
  status?: string
  limit?: number
  offset?: number
}

// ── Refund Action Payloads ────────────────────────────────────

export interface CreateRefundData {
  payment_id: string
  amount: number
  reason?: string
}

export interface GetRefundData {
  refund_id: string
}

// ── Transaction Action Payloads ───────────────────────────────

export interface GetTransactionData {
  transaction_id: string
}

export interface ListTransactionsData {
  merchant_id?: string
  application_id?: string
  status?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

// ── Merchant Action Payloads ──────────────────────────────────

export interface GetMerchantData {
  merchant_id: string
}

export interface ListMerchantsData {
  limit?: number
  offset?: number
}

// ── Application Action Payloads ───────────────────────────────

export interface GetApplicationData {
  application_id: string
}

export interface ListApplicationsData {
  limit?: number
  offset?: number
}

// ── API Key Action Payloads ───────────────────────────────────

export interface CreateApiKeyData {
  name: string
  permissions?: string[]
  environment?: 'test' | 'live'
  expires_at?: string
}

export interface RevokeApiKeyData {
  api_key_id: string
}

// ── Domain Action Payloads ────────────────────────────────────

export interface CreateDomainData {
  domain: string
}

export interface DeleteDomainData {
  domain_id: string
}

// ── Resolved API Key Context (after authentication) ───────────

export interface ApiKeyContext {
  api_key_id: string
  application_id: string
  organization_id: string
  environment: 'test' | 'live'
  permissions: string[]
}

// ── Checkout Response (returned from payment.create) ──────────

export interface CheckoutInfo {
  payment_id: string
  payment_number: string
  order_id: string
  order_number: string
  provider: string
  provider_order_id: string
  amount: number
  currency: string
  key_id: string
  status: string
}
