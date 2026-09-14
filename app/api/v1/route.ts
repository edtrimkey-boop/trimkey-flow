// ============================================================
// Trim Key Flow — Public API v1 Endpoint
// POST /api/v1
//
// Single action-based endpoint. All application requests go here.
// Auth: Authorization: Bearer tk_live_xxxxx
//
// Request format:
//   { "action": "payment.create", "data": { ... } }
//
// Response format:
//   { "success": true, "data": { ... }, "request_id": "req_..." }
// ============================================================

import { NextRequest } from 'next/server'
import { resolveRequestId } from '@/lib/request-id'
import { authenticateApiKey } from '@/lib/api-key'
import { checkActionPermission } from '@/lib/permissions'
import { handleCors, getCorsHeaders, checkRateLimit } from '@/lib/security'
import { handleError, errorResponse, successResponse, ErrorCode, FlowError } from '@/lib/errors'
import { validate } from '@/lib/validation'
import type { FlowRequest, FlowAction } from '@/types/api'

// ── Services ──────────────────────────────────────────────────
import { createPayment, getPayment, listPayments } from '@/services/payment'
import { getOrder, listOrders } from '@/services/order'
import { createRefund, getRefund } from '@/services/refund'
import { getTransaction, listTransactions } from '@/services/transaction'
import { getMerchant, listMerchants } from '@/services/merchant'
import { getApplication, listApplications } from '@/services/application'
import { createApiKey, listApiKeys, revokeApiKey } from '@/services/api-key'
import { addDomain, removeDomain } from '@/services/domain'

// ── Validation Schemas ────────────────────────────────────────
import {
  CreatePaymentSchema,
  GetPaymentSchema,
  ListPaymentsSchema,
  GetOrderSchema,
  ListOrdersSchema,
  CreateRefundSchema,
  GetRefundSchema,
  GetTransactionSchema,
  ListTransactionsSchema,
  GetMerchantSchema,
  ListMerchantsSchema,
  GetApplicationSchema,
  ListApplicationsSchema,
  CreateApiKeySchema,
  RevokeApiKeySchema,
  CreateDomainSchema,
  DeleteDomainSchema,
} from '@/lib/validation'

// ── CORS Preflight ────────────────────────────────────────────

export async function OPTIONS(request: NextRequest) {
  return handleCors(request) ?? new Response(null, { status: 204 })
}

// ── Main Handler ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const requestId = resolveRequestId(request.headers)
  const origin = request.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  try {
    // 1. Parse body
    let body: FlowRequest
    try {
      body = await request.json()
    } catch {
      return errorResponse(ErrorCode.INVALID_REQUEST, 'Request body must be valid JSON', requestId)
    }

    if (!body.action) {
      return errorResponse(ErrorCode.INVALID_REQUEST, 'Missing required field: action', requestId)
    }

    const action = body.action as FlowAction
    const data = body.data ?? {}

    // 2. API key authentication
    const ctx = await authenticateApiKey(request.headers)

    // 3. Rate limiting
    const { allowed, remaining } = checkRateLimit(ctx.api_key_id)
    if (!allowed) {
      return errorResponse(
        ErrorCode.FORBIDDEN,
        'Rate limit exceeded. Max 60 requests/minute per API key.',
        requestId,
        429,
      )
    }

    // 4. Permission check
    checkActionPermission(ctx.permissions, action)

    // 5. Dispatch to service
    const result = await dispatch(action, data, ctx, request)

    const response = successResponse(result, requestId)
    corsHeaders['X-Request-ID'] = requestId
    corsHeaders['X-RateLimit-Remaining'] = String(remaining)
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v))

    return response
  } catch (error) {
    const response = handleError(error, requestId)
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v))
    response.headers.set('X-Request-ID', requestId)
    return response
  }
}

// ── Action Dispatcher ─────────────────────────────────────────

async function dispatch(
  action: FlowAction,
  data: Record<string, unknown>,
  ctx: Parameters<typeof createPayment>[1],
  request: NextRequest,
): Promise<unknown> {
  switch (action) {
    // ── Payments ──────────────────────────────────────────────
    case 'payment.create': {
      const validated = validate(CreatePaymentSchema, data)
      return createPayment(validated, ctx, request.headers)
    }
    case 'payment.get': {
      const validated = validate(GetPaymentSchema, data)
      return getPayment(validated, ctx)
    }
    case 'payment.list': {
      const validated = validate(ListPaymentsSchema, data)
      return listPayments(validated as Parameters<typeof listPayments>[0], ctx)
    }

    // ── Orders ────────────────────────────────────────────────
    case 'order.get': {
      const validated = validate(GetOrderSchema, data)
      return getOrder(validated.order_id, ctx)
    }
    case 'order.list': {
      const validated = validate(ListOrdersSchema, data)
      return listOrders(ctx, validated as Parameters<typeof listOrders>[1])
    }

    // ── Refunds ───────────────────────────────────────────────
    case 'refund.create': {
      const validated = validate(CreateRefundSchema, data)
      return createRefund(validated, ctx)
    }
    case 'refund.get': {
      const validated = validate(GetRefundSchema, data)
      return getRefund(validated, ctx)
    }

    // ── Transactions ──────────────────────────────────────────
    case 'transaction.get': {
      const validated = validate(GetTransactionSchema, data)
      return getTransaction(validated.transaction_id, ctx)
    }
    case 'transaction.list': {
      const validated = validate(ListTransactionsSchema, data)
      return listTransactions(ctx, validated as Parameters<typeof listTransactions>[1])
    }

    // ── Merchants ─────────────────────────────────────────────
    case 'merchant.get': {
      const validated = validate(GetMerchantSchema, data)
      return getMerchant(validated.merchant_id, ctx)
    }
    case 'merchant.list': {
      const validated = validate(ListMerchantsSchema, data)
      return listMerchants(ctx, validated.limit, validated.offset)
    }

    // ── Applications ──────────────────────────────────────────
    case 'application.get': {
      const validated = validate(GetApplicationSchema, data)
      return getApplication(validated.application_id, ctx)
    }
    case 'application.list': {
      const validated = validate(ListApplicationsSchema, data)
      return listApplications(ctx, validated.limit, validated.offset)
    }

    // ── API Keys ──────────────────────────────────────────────
    case 'api_key.create': {
      const validated = validate(CreateApiKeySchema, data)
      return createApiKey(validated, ctx)
    }
    case 'api_key.revoke': {
      const validated = validate(RevokeApiKeySchema, data)
      return revokeApiKey(validated, ctx)
    }

    // ── Domains ───────────────────────────────────────────────
    case 'domain.create': {
      const validated = validate(CreateDomainSchema, data)
      return addDomain(validated.domain, ctx)
    }
    case 'domain.delete': {
      const validated = validate(DeleteDomainSchema, data)
      return removeDomain(validated.domain_id, ctx)
    }

    default:
      throw new FlowError(ErrorCode.INVALID_ACTION, `Unknown action: ${action}`, 400)
  }
}
