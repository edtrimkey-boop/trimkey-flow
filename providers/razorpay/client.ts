// ============================================================
// Trim Key Flow — Razorpay SDK Client Factory
// Creates a Razorpay instance with decrypted merchant credentials.
// Only the Razorpay adapter should call this.
// ============================================================

import Razorpay from 'razorpay'
import type { RazorpayCredentials } from '@/types/payment'

/**
 * Create a Razorpay instance for a specific merchant's credentials.
 * Credentials are passed in decrypted — decryption happens in MerchantService.
 */
export function createRazorpayClient(credentials: RazorpayCredentials): Razorpay {
  return new Razorpay({
    key_id: credentials.key_id,
    key_secret: credentials.key_secret,
  })
}
