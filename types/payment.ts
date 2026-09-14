// ============================================================
// Trim Key Flow — Payment & Provider Types
// ============================================================

// ── Payment Status ────────────────────────────────────────────

export type PaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export type OrderStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export type RefundStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED'

// ── Status Transition Map ─────────────────────────────────────
// Only transitions listed here are allowed

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['PENDING', 'EXPIRED'],
  PENDING: ['PROCESSING', 'FAILED', 'EXPIRED'],
  PROCESSING: ['SUCCESS', 'FAILED'],
  SUCCESS: ['REFUNDED', 'PARTIALLY_REFUNDED'],
  PARTIALLY_REFUNDED: ['REFUNDED'],
  FAILED: [],
  EXPIRED: [],
  REFUNDED: [],
}

export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  CREATED: ['PENDING', 'EXPIRED'],
  PENDING: ['PROCESSING', 'FAILED', 'EXPIRED'],
  PROCESSING: ['SUCCESS', 'FAILED'],
  SUCCESS: ['REFUNDED', 'PARTIALLY_REFUNDED'],
  PARTIALLY_REFUNDED: ['REFUNDED'],
  FAILED: [],
  EXPIRED: [],
  REFUNDED: [],
}

export const REFUND_TRANSITIONS: Record<RefundStatus, RefundStatus[]> = {
  PENDING: ['PROCESSING', 'FAILED'],
  PROCESSING: ['SUCCESS', 'FAILED'],
  SUCCESS: [],
  FAILED: [],
}

export function isValidOrderTransition(from: string, to: string): boolean {
  const allowed = ORDER_TRANSITIONS[from as OrderStatus] ?? []
  return allowed.includes(to as OrderStatus)
}

export function isValidPaymentTransition(from: string, to: string): boolean {
  const allowed = PAYMENT_TRANSITIONS[from as PaymentStatus] ?? []
  return allowed.includes(to as PaymentStatus)
}

export function isValidRefundTransition(from: string, to: string): boolean {
  const allowed = REFUND_TRANSITIONS[from as RefundStatus] ?? []
  return allowed.includes(to as RefundStatus)
}

// ── Provider Types ────────────────────────────────────────────

export interface ProviderOrder {
  provider_order_id: string
  amount: number
  currency: string
  status: string
  raw: Record<string, unknown>
}

export interface ProviderPayment {
  provider_payment_id: string
  provider_order_id: string
  amount: number                 // in paise/smallest unit
  currency: string
  status: string                 // captured | failed | created
  method: string | null
  failure_code: string | null
  failure_reason: string | null
  raw: Record<string, unknown>
}

export interface ProviderRefund {
  provider_refund_id: string
  provider_payment_id: string
  amount: number
  status: string
  raw: Record<string, unknown>
}

export interface CreateOrderInput {
  amount: number                 // in paise
  currency: string
  order_number: string           // Flow order ID for receipt
  notes?: Record<string, string>
}

export interface CreateRefundInput {
  provider_payment_id: string
  amount: number                 // in paise
  refund_number: string
  reason?: string
}

// ── Merchant Provider Credentials ────────────────────────────

export interface RazorpayCredentials {
  key_id: string
  key_secret: string
}
