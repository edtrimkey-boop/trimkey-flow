// ============================================================
// Trim Key Flow — Input Validation Schemas (Zod)
// All action payloads validated before processing.
// ============================================================

import { z } from 'zod'

// ── Shared ────────────────────────────────────────────────────

const uuidSchema = z.string().uuid('Must be a valid UUID')

// ── payment.create ────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
  amount: z
    .number({ required_error: 'amount is required' })
    .int('amount must be an integer (in paise)')
    .positive('amount must be greater than 0'),
  currency: z
    .string({ required_error: 'currency is required' })
    .toUpperCase()
    .refine((v) => v === 'INR', { message: 'Only INR is supported in V1' }),
  merchant_id: uuidSchema,
  purpose: z
    .string({ required_error: 'purpose is required' })
    .min(1)
    .max(255),
  customer: z
    .object({
      name: z.string().max(255).optional(),
      email: z.string().email().optional(),
      phone: z
        .string()
        .regex(/^[6-9]\d{9}$/, 'Phone must be a 10-digit Indian mobile number')
        .optional(),
    })
    .optional(),
  metadata: z.record(z.unknown()).optional(),
})

// ── payment.get ───────────────────────────────────────────────

export const GetPaymentSchema = z.object({
  payment_id: z.string().min(1, 'payment_id is required'),
})

// ── payment.list ──────────────────────────────────────────────

export const ListPaymentsSchema = z.object({
  merchant_id: uuidSchema.optional(),
  status: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

// ── order.get ─────────────────────────────────────────────────

export const GetOrderSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
})

// ── order.list ────────────────────────────────────────────────

export const ListOrdersSchema = z.object({
  merchant_id: uuidSchema.optional(),
  status: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

// ── refund.create ─────────────────────────────────────────────

export const CreateRefundSchema = z.object({
  payment_id: z.string().min(1, 'payment_id is required'),
  amount: z
    .number({ required_error: 'amount is required' })
    .int('amount must be an integer (in paise)')
    .positive('amount must be greater than 0'),
  reason: z.string().max(500).optional(),
})

// ── refund.get ────────────────────────────────────────────────

export const GetRefundSchema = z.object({
  refund_id: z.string().min(1, 'refund_id is required'),
})

// ── transaction.get ───────────────────────────────────────────

export const GetTransactionSchema = z.object({
  transaction_id: z.string().min(1, 'transaction_id is required'),
})

// ── transaction.list ──────────────────────────────────────────

export const ListTransactionsSchema = z.object({
  merchant_id: uuidSchema.optional(),
  application_id: uuidSchema.optional(),
  status: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

// ── merchant.get ──────────────────────────────────────────────

export const GetMerchantSchema = z.object({
  merchant_id: uuidSchema,
})

// ── merchant.list ─────────────────────────────────────────────

export const ListMerchantsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

// ── application.get ───────────────────────────────────────────

export const GetApplicationSchema = z.object({
  application_id: uuidSchema,
})

// ── application.list ──────────────────────────────────────────

export const ListApplicationsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
})

// ── api_key.create ────────────────────────────────────────────

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).optional(),
  environment: z.enum(['test', 'live']).default('live'),
  expires_at: z.string().datetime().optional(),
})

// ── api_key.revoke ────────────────────────────────────────────

export const RevokeApiKeySchema = z.object({
  api_key_id: uuidSchema,
})

// ── domain.create ─────────────────────────────────────────────

export const CreateDomainSchema = z.object({
  domain: z
    .string()
    .min(1)
    .regex(
      /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      'Invalid domain format',
    ),
})

// ── domain.delete ─────────────────────────────────────────────

export const DeleteDomainSchema = z.object({
  domain_id: uuidSchema,
})

// ── Helper ────────────────────────────────────────────────────

import { FlowError, ErrorCode } from '@/lib/errors'

/**
 * Parse and validate data against a Zod schema.
 * Throws FlowError(INVALID_REQUEST) with human-readable message on failure.
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    throw new FlowError(ErrorCode.INVALID_REQUEST, messages.join('; '), 400)
  }
  return result.data
}
