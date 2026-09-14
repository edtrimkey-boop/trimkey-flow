// ============================================================
// Trim Key Flow — Permissions
// Every action requires a specific permission.
// API keys carry a permissions array (JSONB in DB).
// ============================================================

import { FlowError, ErrorCode } from '@/lib/errors'
import type { FlowAction } from '@/types/api'

// ── Permission Constants ──────────────────────────────────────

export const Permission = {
  PAYMENTS_CREATE: 'payments:create',
  PAYMENTS_READ: 'payments:read',
  ORDERS_READ: 'orders:read',
  REFUNDS_CREATE: 'refunds:create',
  REFUNDS_READ: 'refunds:read',
  TRANSACTIONS_READ: 'transactions:read',
  MERCHANTS_READ: 'merchants:read',
  APPLICATIONS_READ: 'applications:read',
  API_KEYS_MANAGE: 'api_keys:manage',
  DOMAINS_MANAGE: 'domains:manage',
} as const

export type PermissionType = (typeof Permission)[keyof typeof Permission]

// ── Action → Permission Map ───────────────────────────────────

export const ACTION_PERMISSIONS: Record<FlowAction, PermissionType> = {
  'payment.create': Permission.PAYMENTS_CREATE,
  'payment.get': Permission.PAYMENTS_READ,
  'payment.list': Permission.PAYMENTS_READ,
  'order.get': Permission.ORDERS_READ,
  'order.list': Permission.ORDERS_READ,
  'refund.create': Permission.REFUNDS_CREATE,
  'refund.get': Permission.REFUNDS_READ,
  'transaction.get': Permission.TRANSACTIONS_READ,
  'transaction.list': Permission.TRANSACTIONS_READ,
  'merchant.get': Permission.MERCHANTS_READ,
  'merchant.list': Permission.MERCHANTS_READ,
  'application.get': Permission.APPLICATIONS_READ,
  'application.list': Permission.APPLICATIONS_READ,
  'api_key.create': Permission.API_KEYS_MANAGE,
  'api_key.revoke': Permission.API_KEYS_MANAGE,
  'domain.create': Permission.DOMAINS_MANAGE,
  'domain.delete': Permission.DOMAINS_MANAGE,
}

// ── Default Permissions for new keys ─────────────────────────

export const DEFAULT_PERMISSIONS: PermissionType[] = [
  Permission.PAYMENTS_CREATE,
  Permission.PAYMENTS_READ,
  Permission.ORDERS_READ,
  Permission.REFUNDS_CREATE,
  Permission.REFUNDS_READ,
  Permission.TRANSACTIONS_READ,
  Permission.MERCHANTS_READ,
  Permission.APPLICATIONS_READ,
]

// ── Permission Check ──────────────────────────────────────────

/**
 * Check if a permission list grants the required permission.
 * Throws FlowError(FORBIDDEN) if not.
 */
export function checkPermission(
  grantedPermissions: string[],
  required: PermissionType,
): void {
  if (!grantedPermissions.includes(required)) {
    throw new FlowError(
      ErrorCode.FORBIDDEN,
      `This API key does not have the '${required}' permission`,
      403,
    )
  }
}

/**
 * Resolve and check permission for a given action.
 */
export function checkActionPermission(
  grantedPermissions: string[],
  action: FlowAction,
): void {
  const required = ACTION_PERMISSIONS[action]
  if (!required) {
    throw new FlowError(ErrorCode.INVALID_ACTION, `Unknown action: ${action}`, 400)
  }
  checkPermission(grantedPermissions, required)
}
