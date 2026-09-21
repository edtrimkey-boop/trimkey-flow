'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getCheckoutData(paymentNumber: string) {
  const db = createAdminClient()
  
  const { data: payment, error } = await db
    .from('payments')
    .select(`
      amount, 
      currency_code,
      merchant_id,
      order_id
    `)
    .eq('payment_number', paymentNumber)
    .single()

  if (error || !payment) throw new Error('Payment not found')

  const { data: order } = await db.from('orders').select('provider_order_id').eq('id', payment.order_id).single()
  const { data: merchant } = await db.from('merchants').select('name').eq('id', payment.merchant_id).single()

  return {
    amount: payment.amount,
    currency: payment.currency_code,
    merchant_name: merchant?.name || 'Merchant',
    provider_order_id: order?.provider_order_id,
    key_id: process.env.RAZORPAY_KEY_ID
  }
}
