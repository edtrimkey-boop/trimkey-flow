// ============================================================
// Trim Key Flow — Centralized Error Handling
// Clean, structured errors — never exposes internals
// ============================================================

import { NextResponse } from 'next/server'

// ── Error Codes ───────────────────────────────────────────────

export const ErrorCode = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  API_KEY_EXPIRED: 'API_KEY_EXPIRED',
  API_KEY_REVOKED: 'API_KEY_REVOKED',

  // Validation
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_ACTION: 'INVALID_ACTION',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_CURRENCY: 'INVALID_CURRENCY',
  INVALID_PAYMENT_STATE: 'INVALID_PAYMENT_STATE',

  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  MERCHANT_NOT_FOUND: 'MERCHANT_NOT_FOUND',
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  REFUND_NOT_FOUND: 'REFUND_NOT_FOUND',
  APPLICATION_NOT_FOUND: 'APPLICATION_NOT_FOUND',
  DOMAIN_NOT_FOUND: 'DOMAIN_NOT_FOUND',
  API_KEY_NOT_FOUND: 'API_KEY_NOT_FOUND',

  // Business Logic
  PROVIDER_NOT_CONFIGURED: 'PROVIDER_NOT_CONFIGURED',
  MERCHANT_UNAUTHORIZED: 'MERCHANT_UNAUTHORIZED',
  DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',
  OVER_REFUND: 'OVER_REFUND',
  PAYMENT_NOT_REFUNDABLE: 'PAYMENT_NOT_REFUNDABLE',

  // Provider
  PROVIDER_ERROR: 'PROVIDER_ERROR',

  // Webhooks
  WEBHOOK_SIGNATURE_INVALID: 'WEBHOOK_SIGNATURE_INVALID',
  WEBHOOK_ALREADY_PROCESSED: 'WEBHOOK_ALREADY_PROCESSED',

  // Internal
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode]

// ── FlowError class ───────────────────────────────────────────

export class FlowError extends Error {
  public readonly code: ErrorCodeType
  public readonly statusCode: number

  constructor(code: ErrorCodeType, message: string, statusCode = 400) {
    super(message)
    this.name = 'FlowError'
    this.code = code
    this.statusCode = statusCode
  }
}

// ── HTTP Status Mapping ───────────────────────────────────────

const STATUS_MAP: Record<string, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.API_KEY_EXPIRED]: 401,
  [ErrorCode.API_KEY_REVOKED]: 401,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.MERCHANT_NOT_FOUND]: 404,
  [ErrorCode.PAYMENT_NOT_FOUND]: 404,
  [ErrorCode.ORDER_NOT_FOUND]: 404,
  [ErrorCode.REFUND_NOT_FOUND]: 404,
  [ErrorCode.APPLICATION_NOT_FOUND]: 404,
  [ErrorCode.DOMAIN_NOT_FOUND]: 404,
  [ErrorCode.API_KEY_NOT_FOUND]: 404,
  [ErrorCode.DUPLICATE_REQUEST]: 409,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.PROVIDER_ERROR]: 502,
}

export function getStatusCode(code: string): number {
  return STATUS_MAP[code] ?? 400
}

// ── Response Builders ─────────────────────────────────────────

export function successResponse<T>(
  data: T,
  requestId: string,
  status = 200,
): NextResponse {
  return NextResponse.json({ success: true, data, request_id: requestId }, { status })
}

export function errorResponse(
  code: ErrorCodeType,
  message: string,
  requestId: string,
  statusCode?: number,
): NextResponse {
  const status = statusCode ?? getStatusCode(code)
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
      request_id: requestId,
    },
    { status },
  )
}

export function handleError(error: unknown, requestId: string): NextResponse {
  if (error instanceof FlowError) {
    return errorResponse(error.code, error.message, requestId, error.statusCode)
  }

  // Never expose internal errors
  console.error('[Trim Key Flow] Unhandled error:', error)
  return errorResponse(ErrorCode.INTERNAL_ERROR, 'An internal error occurred', requestId, 500)
}
