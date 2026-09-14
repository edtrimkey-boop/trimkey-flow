// ============================================================
// Trim Key Flow — Razorpay Webhook Signature Verification
// MUST use raw body — do NOT parse JSON before calling this.
// ============================================================

import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verify Razorpay webhook signature.
 *
 * Razorpay signs webhooks using HMAC-SHA256 of the raw request body.
 * The signature is sent in the X-Razorpay-Signature header.
 *
 * @param rawBody - Raw request body as string (from request.text())
 * @param signature - Value of X-Razorpay-Signature header
 * @param webhookSecret - Merchant's webhook secret (decrypted)
 * @returns true if signature is valid
 */
export function verifyRazorpayWebhook(
  rawBody: string,
  signature: string,
  webhookSecret: string,
): boolean {
  try {
    const expected = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    const expectedBuffer = Buffer.from(expected, 'hex')
    const signatureBuffer = Buffer.from(signature, 'hex')

    if (expectedBuffer.length !== signatureBuffer.length) return false

    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(expectedBuffer, signatureBuffer)
  } catch {
    return false
  }
}
