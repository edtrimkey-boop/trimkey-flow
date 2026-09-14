// ============================================================
// Trim Key Flow — Webhook Delivery Service
// Delivers events to application webhook URLs
// Records attempts, handles retries with exponential backoff
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent, AuditAction } from '@/services/audit'
import type { WebhookDeliveryInsert } from '@/types/database'

export interface WebhookPayload {
  event: string
  id: string
  payment?: {
    id: string
    payment_number: string
    order_id: string
    order_number: string
    amount: number
    currency: string
    status: string
    provider: string
    provider_payment_id: string | null
    paid_at: string | null
  }
  refund?: {
    id: string
    refund_number: string
    payment_id: string
    amount: number
    status: string
  }
  timestamp: string
}

const MAX_ATTEMPTS = 5
const BASE_RETRY_DELAY_MS = 30_000 // 30 seconds

function nextRetryAt(attemptNumber: number): string {
  // Exponential backoff: 30s, 2min, 8min, 32min, done
  const delay = BASE_RETRY_DELAY_MS * Math.pow(4, attemptNumber - 1)
  return new Date(Date.now() + delay).toISOString()
}

/**
 * Deliver a webhook event to an application's webhook URL.
 * Records the delivery attempt in webhook_deliveries.
 */
export async function deliverWebhook(
  webhookEventId: string,
  applicationId: string,
  endpointUrl: string,
  eventType: string,
  payload: WebhookPayload,
  attemptNumber = 1,
): Promise<void> {
  const db = createAdminClient()
  let httpStatus: number | null = null
  let responseBody: string | null = null
  let deliveryStatus = 'FAILED'
  let deliveredAt: string | null = null

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trim-Key-Flow-Event': eventType,
        'X-Trim-Key-Flow-Delivery': `${webhookEventId}-${attemptNumber}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000), // 10s timeout
    })

    httpStatus = response.status
    responseBody = await response.text().catch(() => '')

    if (response.ok) {
      deliveryStatus = 'SUCCESS'
      deliveredAt = new Date().toISOString()
    } else {
      deliveryStatus = attemptNumber < MAX_ATTEMPTS ? 'RETRYING' : 'FAILED'
    }
  } catch {
    deliveryStatus = attemptNumber < MAX_ATTEMPTS ? 'RETRYING' : 'FAILED'
  }

  // Record delivery attempt
  const delivery: WebhookDeliveryInsert = {
    webhook_event_id: webhookEventId,
    application_id: applicationId,
    endpoint_url: endpointUrl,
    event_type: eventType,
    attempt_number: attemptNumber,
    http_status: httpStatus,
    response_body: responseBody ? responseBody.substring(0, 1000) : null,
    status: deliveryStatus,
    next_retry_at:
      deliveryStatus === 'RETRYING' ? nextRetryAt(attemptNumber) : null,
    delivered_at: deliveredAt,
  }

  await db.from('webhook_deliveries').insert(delivery)

  if (deliveryStatus === 'SUCCESS') {
    logAuditEvent({
      action: AuditAction.WEBHOOK_DELIVERED,
      resourceType: 'webhook_delivery',
      applicationId,
      metadata: { event_type: eventType, attempt: attemptNumber },
    }).catch(() => {})
  } else if (deliveryStatus === 'FAILED') {
    logAuditEvent({
      action: AuditAction.WEBHOOK_DELIVERY_FAILED,
      resourceType: 'webhook_delivery',
      applicationId,
      metadata: { event_type: eventType, attempt: attemptNumber, status: httpStatus },
    }).catch(() => {})
  }
}
