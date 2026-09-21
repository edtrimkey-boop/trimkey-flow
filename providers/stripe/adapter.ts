// @ts-nocheck
import type { PaymentProvider } from '../types'
import type {
  CreateOrderInput,
  CreateRefundInput,
  ProviderOrder,
  ProviderPayment,
  ProviderRefund,
} from '@/types/payment'

export class StripeAdapter implements PaymentProvider {
  constructor(private credentials: any) {}

  async createOrder(input: CreateOrderInput): Promise<ProviderOrder> {
    console.log('[Stripe Adapter] createOrder called for', input.currency, input.amount)
    return {
      provider_order_id: 'pi_stripe_' + Math.floor(Math.random() * 1000000),
      amount: input.amount,
      currency: input.currency,
    }
  }

  async getPayment(providerPaymentId: string): Promise<ProviderPayment> {
    return {
      provider_payment_id: providerPaymentId,
      provider_order_id: 'pi_stripe_unknown',
      amount: 0,
      currency: 'USD',
      status: 'SUCCESS',
    }
  }

  async createRefund(input: CreateRefundInput): Promise<ProviderRefund> {
    return {
      provider_refund_id: 're_stripe_' + Math.floor(Math.random() * 1000000),
      provider_payment_id: input.providerPaymentId,
      amount: input.amount,
      status: 'SUCCESS',
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
    return true
  }
}

