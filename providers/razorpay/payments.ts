// ============================================================
// Trim Key Flow — Razorpay Payments
// ============================================================

import { FlowError, ErrorCode } from '@/lib/errors'
import { createRazorpayClient } from './client'
import type { ProviderPayment, RazorpayCredentials } from '@/types/payment'

export async function getRazorpayPayment(
  credentials: RazorpayCredentials,
  providerPaymentId: string,
): Promise<ProviderPayment> {
  const razorpay = createRazorpayClient(credentials)

  try {
    const payment = await razorpay.payments.fetch(providerPaymentId)
    const p = payment as unknown as Record<string, unknown>

    return {
      provider_payment_id: payment.id,
      provider_order_id: (p.order_id as string) ?? '',
      amount: payment.amount as number,
      currency: payment.currency,
      status: payment.status,
      method: (p.method as string) ?? null,
      failure_code: (p.error_code as string) ?? null,
      failure_reason: (p.error_description as string) ?? null,
      raw: p,
    }
  } catch (err: unknown) {
    const rzpErr = err as { error?: { description?: string } }
    const message = rzpErr?.error?.description ?? 'Razorpay payment fetch failed'
    throw new FlowError(ErrorCode.PROVIDER_ERROR, message, 502)
  }
}
