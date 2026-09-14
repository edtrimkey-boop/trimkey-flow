// ============================================================
// Trim Key Flow — Provider Interface
// All payment providers MUST implement this interface.
// The PaymentService only talks to this interface —
// never directly to Razorpay or any other provider SDK.
// ============================================================

import type {
  CreateOrderInput,
  CreateRefundInput,
  ProviderOrder,
  ProviderPayment,
  ProviderRefund,
} from '@/types/payment'

export interface PaymentProvider {
  /**
   * Create an order/payment request with the provider.
   */
  createOrder(input: CreateOrderInput): Promise<ProviderOrder>

  /**
   * Fetch full payment details from the provider by payment ID.
   */
  getPayment(providerPaymentId: string): Promise<ProviderPayment>

  /**
   * Create a refund for a captured payment.
   */
  createRefund(input: CreateRefundInput): Promise<ProviderRefund>

  /**
   * Verify webhook signature using the raw request body.
   * Must use the merchant's webhook secret (not the global one).
   */
  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    webhookSecret: string,
  ): boolean
}
