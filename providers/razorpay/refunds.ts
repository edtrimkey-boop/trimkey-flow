// ============================================================
// Trim Key Flow — Razorpay Refunds
// ============================================================

import { FlowError, ErrorCode } from '@/lib/errors'
import { createRazorpayClient } from './client'
import type { CreateRefundInput, ProviderRefund, RazorpayCredentials } from '@/types/payment'

export async function createRazorpayRefund(
  credentials: RazorpayCredentials,
  input: CreateRefundInput,
): Promise<ProviderRefund> {
  const razorpay = createRazorpayClient(credentials)

  try {
    const refund = await razorpay.payments.refund(input.provider_payment_id, {
      amount: input.amount,
      notes: {
        refund_number: input.refund_number,
        reason: input.reason ?? '',
      },
    })

    const r = refund as unknown as Record<string, unknown>

    return {
      provider_refund_id: refund.id,
      provider_payment_id: input.provider_payment_id,
      amount: refund.amount as number,
      status: r.status as string,
      raw: r,
    }
  } catch (err: unknown) {
    const rzpErr = err as { error?: { description?: string } }
    const message = rzpErr?.error?.description ?? 'Razorpay refund creation failed'
    throw new FlowError(ErrorCode.PROVIDER_ERROR, message, 502)
  }
}
