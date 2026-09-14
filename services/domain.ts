// ============================================================
// Trim Key Flow — Domain Service
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { FlowError, ErrorCode } from '@/lib/errors'
import { randomBytes } from 'crypto'
import type { ApplicationDomain } from '@/types/database'
import type { ApiKeyContext } from '@/types/api'

export async function listDomains(ctx: ApiKeyContext): Promise<ApplicationDomain[]> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('application_domains')
    .select('*')
    .eq('application_id', ctx.application_id)
    .order('created_at', { ascending: false })

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch domains', 500)
  return (data as ApplicationDomain[]) ?? []
}

export async function addDomain(
  domain: string,
  ctx: ApiKeyContext,
): Promise<ApplicationDomain> {
  const db = createAdminClient()
  const verificationToken = randomBytes(16).toString('hex')

  const { data, error } = await db
    .from('application_domains')
    .insert({
      application_id: ctx.application_id,
      domain,
      is_verified: false,
      verification_token: verificationToken,
    })
    .select()
    .single<ApplicationDomain>()

  if (error) {
    if (error.code === '23505') {
      throw new FlowError(ErrorCode.DUPLICATE_REQUEST, 'Domain already registered', 409)
    }
    throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to add domain', 500)
  }

  return data
}

export async function removeDomain(domainId: string, ctx: ApiKeyContext): Promise<void> {
  const db = createAdminClient()

  const { error } = await db
    .from('application_domains')
    .delete()
    .eq('id', domainId)
    .eq('application_id', ctx.application_id)

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to remove domain', 500)
}

export async function verifyDomain(domainId: string, ctx: ApiKeyContext): Promise<ApplicationDomain> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('application_domains')
    .update({ is_verified: true, verified_at: new Date().toISOString() })
    .eq('id', domainId)
    .eq('application_id', ctx.application_id)
    .select()
    .single<ApplicationDomain>()

  if (error || !data) throw new FlowError(ErrorCode.DOMAIN_NOT_FOUND, 'Domain not found', 404)

  return data
}
