// ============================================================
// Trim Key Flow — Razorpay Adapter
// Implements the PaymentProvider interface using Razorpay SDK.
// This is the ONLY file that knows about Razorpay specifics.
// ============================================================

import type { PaymentProvider } from '@/providers/types'
import type {
  CreateOrderInput,
  CreateRefundInput,
  ProviderOrder,
  ProviderPayment,
  ProviderRefund,
  RazorpayCredentials,
} from '@/types/payment'
import { createRazorpayOrder } from './orders'
import { getRazorpayPayment } from './payments'
import { createRazorpayRefund } from './refunds'
import { verifyRazorpayWebhook } from './webhook'

export class RazorpayAdapter implements PaymentProvider {
  private credentials: RazorpayCredentials

  constructor(credentials: RazorpayCredentials) {
    this.credentials = credentials
  }

  async createOrder(input: CreateOrderInput): Promise<ProviderOrder> {
    return createRazorpayOrder(this.credentials, input)
  }

  async getPayment(providerPaymentId: string): Promise<ProviderPayment> {
    return getRazorpayPayment(this.credentials, providerPaymentId)
  }

  async createRefund(input: CreateRefundInput): Promise<ProviderRefund> {
    return createRazorpayRefund(this.credentials, input)
  }

  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    webhookSecret: string,
  ): boolean {
    return verifyRazorpayWebhook(rawBody, signature, webhookSecret)
  }
}
