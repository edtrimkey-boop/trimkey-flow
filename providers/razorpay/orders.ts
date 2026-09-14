// ============================================================
// Trim Key Flow — Razorpay Orders
// ============================================================

import { FlowError, ErrorCode } from '@/lib/errors'
import { createRazorpayClient } from './client'
import type { CreateOrderInput, ProviderOrder, RazorpayCredentials } from '@/types/payment'

export async function createRazorpayOrder(
  credentials: RazorpayCredentials,
  input: CreateOrderInput,
): Promise<ProviderOrder> {
  const razorpay = createRazorpayClient(credentials)

  try {
    const order = await razorpay.orders.create({
      amount: input.amount,           // in paise
      currency: input.currency,
      receipt: input.order_number,    // Flow order ID as receipt
      notes: input.notes ?? {},
    })

    return {
      provider_order_id: order.id,
      amount: order.amount as number,
      currency: order.currency,
      status: order.status,
      raw: order as unknown as Record<string, unknown>,
    }
  } catch (err: unknown) {
    const rzpErr = err as { error?: { description?: string } }
    const message = rzpErr?.error?.description ?? 'Razorpay order creation failed'
    throw new FlowError(ErrorCode.PROVIDER_ERROR, message, 502)
  }
}
