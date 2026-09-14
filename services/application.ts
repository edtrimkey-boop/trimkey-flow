// ============================================================
// Trim Key Flow — Application Service
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { FlowError, ErrorCode } from '@/lib/errors'
import type { Application } from '@/types/database'
import type { ApiKeyContext } from '@/types/api'

/**
 * Get a single application by ID, scoped to the caller's organization.
 */
export async function getApplication(
  applicationId: string,
  ctx: ApiKeyContext,
): Promise<Application> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .eq('organization_id', ctx.organization_id)
    .maybeSingle<Application>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch application', 500)
  if (!data) throw new FlowError(ErrorCode.APPLICATION_NOT_FOUND, 'Application not found', 404)

  return data
}

/**
 * List all applications for the caller's organization.
 */
export async function listApplications(
  ctx: ApiKeyContext,
  limit = 20,
  offset = 0,
): Promise<Application[]> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('applications')
    .select('*')
    .eq('organization_id', ctx.organization_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch applications', 500)

  return (data as Application[]) ?? []
}

/**
 * Resolve the application associated with an API key.
 * This is called internally during request authentication.
 */
export async function resolveApplication(applicationId: string): Promise<Application> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .eq('status', 'active')
    .maybeSingle<Application>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to resolve application', 500)
  if (!data) throw new FlowError(ErrorCode.APPLICATION_NOT_FOUND, 'Application not found or inactive', 404)

  return data
}
