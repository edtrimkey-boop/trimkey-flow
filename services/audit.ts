// ============================================================
// Trim Key Flow — Audit Service
// Writes immutable audit events to the audit_logs table.
// Never log secrets, credentials, or card data.
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import type { AuditLogInsert } from '@/types/database'

// ── Audit Actions ─────────────────────────────────────────────

export const AuditAction = {
  // Applications
  APPLICATION_CREATED: 'APPLICATION_CREATED',
  APPLICATION_UPDATED: 'APPLICATION_UPDATED',

  // API Keys
  API_KEY_CREATED: 'API_KEY_CREATED',
  API_KEY_REVOKED: 'API_KEY_REVOKED',

  // Merchants
  MERCHANT_CREATED: 'MERCHANT_CREATED',
  MERCHANT_UPDATED: 'MERCHANT_UPDATED',
  PROVIDER_CONNECTED: 'PROVIDER_CONNECTED',
  PROVIDER_DISCONNECTED: 'PROVIDER_DISCONNECTED',

  // Payments
  PAYMENT_CREATED: 'PAYMENT_CREATED',
  PAYMENT_SUCCEEDED: 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_AMOUNT_MISMATCH: 'PAYMENT_AMOUNT_MISMATCH',

  // Refunds
  REFUND_CREATED: 'REFUND_CREATED',
  REFUND_SUCCEEDED: 'REFUND_SUCCEEDED',
  REFUND_FAILED: 'REFUND_FAILED',

  // Domains
  DOMAIN_CREATED: 'DOMAIN_CREATED',
  DOMAIN_DELETED: 'DOMAIN_DELETED',
  DOMAIN_VERIFIED: 'DOMAIN_VERIFIED',

  // Webhooks
  WEBHOOK_RECEIVED: 'WEBHOOK_RECEIVED',
  WEBHOOK_PROCESSED: 'WEBHOOK_PROCESSED',
  WEBHOOK_FAILED: 'WEBHOOK_FAILED',
  WEBHOOK_DELIVERED: 'WEBHOOK_DELIVERED',
  WEBHOOK_DELIVERY_FAILED: 'WEBHOOK_DELIVERY_FAILED',
} as const

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction]

// ── Audit Event Parameters ────────────────────────────────────

interface AuditEventParams {
  action: AuditActionType
  resourceType: string
  resourceId?: string
  organizationId?: string
  userId?: string
  applicationId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Write an audit event. Fire and forget — never blocks the main flow.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  const db = createAdminClient()

  const entry: AuditLogInsert = {
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId ?? null,
    organization_id: params.organizationId ?? null,
    user_id: params.userId ?? null,
    application_id: params.applicationId ?? null,
    metadata: params.metadata ?? null,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
  }

  const { error } = await db.from('audit_logs').insert(entry)

  if (error) {
    // Audit log failures must not break the main operation
    console.error('[Audit] Failed to write audit log:', error.message)
  }
}
