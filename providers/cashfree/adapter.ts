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

export interface CashfreeCredentials {
  app_id: string
  secret_key: string
  environment?: 'TEST' | 'PROD'
}

export class CashfreeAdapter implements PaymentProvider {
  private appId: string
  private secretKey: string
  private isProd: boolean

  constructor(credentials: CashfreeCredentials | { client_id?: string; client_secret?: string; app_id?: string; secret_key?: string }) {
    const creds = credentials as any
    this.appId = creds.app_id || creds.client_id || process.env.CASHFREE_APP_ID || ''
    this.secretKey = creds.secret_key || creds.client_secret || process.env.CASHFREE_SECRET_KEY || ''
    this.isProd = creds.environment === 'PROD' || process.env.CASHFREE_ENVIRONMENT === 'PROD'
  }

  private getBaseUrl(): string {
    return this.isProd ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg'
  }

  private getHeaders(): Record<string, string> {
    return {
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'x-api-version': '2023-08-01',
      'Content-Type': 'application/json',
    }
  }

  async createOrder(input: CreateOrderInput): Promise<ProviderOrder> {
    if (!this.appId || !this.secretKey || this.appId.startsWith('dummy') || this.appId === 'test') {
      const mockOrderId = `cf_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      return {
        provider_order_id: mockOrderId,
        amount: input.amount,
        currency: input.currency.toUpperCase(),
        status: 'ACTIVE',
        raw: { order_id: mockOrderId, mock: true },
      }
    }

    try {
      const res = await fetch(`${this.getBaseUrl()}/orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          order_id: input.order_number,
          order_amount: Number((input.amount / 100).toFixed(2)), // Convert paise to INR
          order_currency: input.currency.toUpperCase(),
          customer_details: {
            customer_id: `cust_${input.order_number}`,
            customer_phone: '9999999999',
          },
          order_note: input.notes?.purpose || 'Payment',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new FlowError(ErrorCode.PROVIDER_ERROR, data?.message || 'Cashfree order creation failed', 502)
      }

      return {
        provider_order_id: data.order_id || data.cf_order_id,
        amount: input.amount,
        currency: data.order_currency || input.currency,
        status: data.order_status || 'ACTIVE',
        raw: data,
      }
    } catch (err: any) {
      if (err instanceof FlowError) throw err
      throw new FlowError(ErrorCode.PROVIDER_ERROR, err?.message || 'Cashfree connection failed', 502)
    }
  }

  async getPayment(providerPaymentId: string): Promise<ProviderPayment> {
    if (!this.appId || !this.secretKey || this.appId.startsWith('dummy')) {
      return {
        provider_payment_id: providerPaymentId,
        provider_order_id: providerPaymentId,
        amount: 100,
        currency: 'INR',
        status: 'captured',
        method: 'upi',
        failure_code: null,
        failure_reason: null,
        raw: { mock: true },
      }
    }

    try {
      const res = await fetch(`${this.getBaseUrl()}/orders/${encodeURIComponent(providerPaymentId)}/payments`, {
        headers: this.getHeaders(),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new FlowError(ErrorCode.PROVIDER_ERROR, data?.message || 'Cashfree fetch failed', 502)
      }

      const payment = Array.isArray(data) ? data[0] : data
      const isSuccess = payment?.payment_status === 'SUCCESS'

      return {
        provider_payment_id: String(payment?.cf_payment_id || providerPaymentId),
        provider_order_id: providerPaymentId,
        amount: Math.round((payment?.payment_amount || 0) * 100),
        currency: payment?.payment_currency || 'INR',
        status: isSuccess ? 'captured' : 'failed',
        method: payment?.payment_group || 'upi',
        failure_code: payment?.payment_completion_status || null,
        failure_reason: payment?.payment_message || null,
        raw: payment || {},
      }
    } catch (err: any) {
      if (err instanceof FlowError) throw err
      throw new FlowError(ErrorCode.PROVIDER_ERROR, err?.message || 'Cashfree fetch failed', 502)
    }
  }

  async createRefund(input: CreateRefundInput): Promise<ProviderRefund> {
    if (!this.appId || !this.secretKey || this.appId.startsWith('dummy')) {
      const mockRefundId = `cf_ref_${Date.now()}`
      return {
        provider_refund_id: mockRefundId,
        provider_payment_id: input.provider_payment_id,
        amount: input.amount,
        status: 'SUCCESS',
        raw: { mock: true },
      }
    }

    try {
      const res = await fetch(`${this.getBaseUrl()}/orders/${encodeURIComponent(input.provider_payment_id)}/refunds`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          refund_amount: Number((input.amount / 100).toFixed(2)),
          refund_id: input.refund_number,
          refund_note: input.reason || 'Customer refund',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new FlowError(ErrorCode.PROVIDER_ERROR, data?.message || 'Cashfree refund failed', 502)
      }

      return {
        provider_refund_id: data.cf_refund_id || input.refund_number,
        provider_payment_id: input.provider_payment_id,
        amount: input.amount,
        status: data.refund_status === 'SUCCESS' ? 'SUCCESS' : data.refund_status,
        raw: data,
      }
    } catch (err: any) {
      if (err instanceof FlowError) throw err
      throw new FlowError(ErrorCode.PROVIDER_ERROR, err?.message || 'Cashfree refund failed', 502)
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
    if (!signature || !webhookSecret) return false
    try {
      // Cashfree signs using timestamp + rawBody or rawBody with HMAC-SHA256
      const computed = createHmac('sha256', webhookSecret).update(rawBody).digest('base64')
      const compBuf = Buffer.from(computed)
      const sigBuf = Buffer.from(signature)

      if (compBuf.length === sigBuf.length && timingSafeEqual(compBuf, sigBuf)) {
        return true
      }

      // Alternative hex format check
      const computedHex = createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
      const hexBuf = Buffer.from(computedHex)
      if (hexBuf.length === sigBuf.length && timingSafeEqual(hexBuf, sigBuf)) {
        return true
      }

      return false
    } catch {
      return false
    }
  }
}
