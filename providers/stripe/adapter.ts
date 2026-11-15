import { createHmac, timingSafeEqual } from 'crypto'
import type { PaymentProvider } from '../types'
import type {
  CreateOrderInput,
  CreateRefundInput,
  ProviderOrder,
  ProviderPayment,
  ProviderRefund,
} from '@/types/payment'
import { FlowError, ErrorCode } from '@/lib/errors'

export interface StripeCredentials {
  secret_key: string
  publishable_key?: string
}

export class StripeAdapter implements PaymentProvider {
  private secretKey: string

  constructor(credentials: StripeCredentials | { key?: string; secret_key?: string }) {
    this.secretKey = (credentials as any).secret_key || (credentials as any).key || process.env.STRIPE_SECRET_KEY || ''
  }

  async createOrder(input: CreateOrderInput): Promise<ProviderOrder> {
    // If running in developer mode or test credentials without real Stripe key, generate mock response
    if (!this.secretKey || this.secretKey.startsWith('dummy') || this.secretKey === 'test') {
      const mockId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      return {
        provider_order_id: mockId,
        amount: input.amount,
        currency: input.currency.toUpperCase(),
        status: 'requires_payment_method',
        raw: { id: mockId, mock: true, amount: input.amount, currency: input.currency },
      }
    }

    try {
      const body = new URLSearchParams()
      body.append('amount', String(Math.round(input.amount)))
      body.append('currency', input.currency.toLowerCase())
      body.append('metadata[order_number]', input.order_number)
      if (input.notes) {
        for (const [k, v] of Object.entries(input.notes)) {
          body.append(`metadata[${k}]`, String(v))
        }
      }

      const res = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new FlowError(ErrorCode.PROVIDER_ERROR, data?.error?.message || 'Stripe payment intent creation failed', 502)
      }

      return {
        provider_order_id: data.id,
        amount: data.amount,
        currency: data.currency.toUpperCase(),
        status: data.status,
        raw: data,
      }
    } catch (err: any) {
      if (err instanceof FlowError) throw err
      throw new FlowError(ErrorCode.PROVIDER_ERROR, err?.message || 'Stripe connection failed', 502)
    }
  }

  async getPayment(providerPaymentId: string): Promise<ProviderPayment> {
    if (!this.secretKey || this.secretKey.startsWith('dummy') || this.secretKey === 'test') {
      return {
        provider_payment_id: providerPaymentId,
        provider_order_id: providerPaymentId,
        amount: 100,
        currency: 'USD',
        status: 'captured',
        method: 'card',
        failure_code: null,
        failure_reason: null,
        raw: { mock: true },
      }
    }

    try {
      const res = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(providerPaymentId)}`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        throw new FlowError(ErrorCode.PROVIDER_ERROR, data?.error?.message || 'Stripe payment fetch failed', 502)
      }

      const isSuccess = data.status === 'succeeded'
      return {
        provider_payment_id: data.latest_charge || data.id,
        provider_order_id: data.id,
        amount: data.amount,
        currency: (data.currency || 'USD').toUpperCase(),
        status: isSuccess ? 'captured' : data.status,
        method: data.payment_method_types?.[0] || 'card',
        failure_code: data.last_payment_error?.code || null,
        failure_reason: data.last_payment_error?.message || null,
        raw: data,
      }
    } catch (err: any) {
      if (err instanceof FlowError) throw err
      throw new FlowError(ErrorCode.PROVIDER_ERROR, err?.message || 'Stripe fetch failed', 502)
    }
  }

  async createRefund(input: CreateRefundInput): Promise<ProviderRefund> {
    if (!this.secretKey || this.secretKey.startsWith('dummy') || this.secretKey === 'test') {
      const mockRefundId = `re_mock_${Date.now()}`
      return {
        provider_refund_id: mockRefundId,
        provider_payment_id: input.provider_payment_id,
        amount: input.amount,
        status: 'SUCCESS',
        raw: { id: mockRefundId, mock: true },
      }
    }

    try {
      const body = new URLSearchParams()
      body.append('payment_intent', input.provider_payment_id)
      body.append('amount', String(Math.round(input.amount)))
      if (input.reason) {
        body.append('reason', 'requested_by_customer')
      }

      const res = await fetch('https://api.stripe.com/v1/refunds', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new FlowError(ErrorCode.PROVIDER_ERROR, data?.error?.message || 'Stripe refund failed', 502)
      }

      return {
        provider_refund_id: data.id,
        provider_payment_id: input.provider_payment_id,
        amount: data.amount,
        status: data.status === 'succeeded' ? 'SUCCESS' : data.status,
        raw: data,
      }
    } catch (err: any) {
      if (err instanceof FlowError) throw err
      throw new FlowError(ErrorCode.PROVIDER_ERROR, err?.message || 'Stripe refund failed', 502)
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
    if (!signature || !webhookSecret) return false
    try {
      // Stripe header format: t=timestamp,v1=signature
      const parts = signature.split(',').reduce<Record<string, string>>((acc, part) => {
        const [k, v] = part.split('=')
        if (k && v) acc[k.trim()] = v.trim()
        return acc
      }, {})

      const timestamp = parts['t']
      const expectedV1 = parts['v1']
      if (!timestamp || !expectedV1) return false

      const signedPayload = `${timestamp}.${rawBody}`
      const hmac = createHmac('sha256', webhookSecret).update(signedPayload).digest('hex')

      const hmacBuf = Buffer.from(hmac, 'hex')
      const expectedBuf = Buffer.from(expectedV1, 'hex')

      if (hmacBuf.length !== expectedBuf.length) return false
      return timingSafeEqual(hmacBuf, expectedBuf)
    } catch {
      return false
    }
  }
}
