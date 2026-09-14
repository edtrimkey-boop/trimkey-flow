// ============================================================
// Trim Key Flow — API Key Service
// Create, list, revoke API keys
// Secret shown only once — only hash stored in DB
// ============================================================

import { createAdminClient } from '@/lib/supabase/admin'
import { FlowError, ErrorCode } from '@/lib/errors'
import { generateApiKey } from '@/lib/api-key'
import { DEFAULT_PERMISSIONS } from '@/lib/permissions'
import type { ApiKey } from '@/types/database'
import type { ApiKeyContext, CreateApiKeyData, RevokeApiKeyData } from '@/types/api'

export interface CreatedApiKey {
  id: string
  name: string
  key_prefix: string
  full_secret: string     // Shown ONCE — not stored
  environment: string
  permissions: string[]
  created_at: string
}

export async function createApiKey(
  data: CreateApiKeyData,
  ctx: ApiKeyContext,
): Promise<CreatedApiKey> {
  const db = createAdminClient()
  const env = data.environment ?? 'live'
  const generated = generateApiKey(env)

  const { data: apiKey, error } = await db
    .from('api_keys')
    .insert({
      application_id: ctx.application_id,
      name: data.name,
      key_prefix: generated.keyPrefix,
      secret_hash: generated.secretHash,
      environment: env,
      status: 'active',
      permissions: data.permissions ?? DEFAULT_PERMISSIONS,
      expires_at: data.expires_at ?? null,
    })
    .select()
    .single<ApiKey>()

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to create API key', 500)

  return {
    id: apiKey.id,
    name: apiKey.name,
    key_prefix: apiKey.key_prefix,
    full_secret: generated.fullSecret,   // Only returned here, never again
    environment: apiKey.environment,
    permissions: (apiKey.permissions as string[]) ?? [],
    created_at: apiKey.created_at,
  }
}

export async function listApiKeys(ctx: ApiKeyContext): Promise<Omit<ApiKey, 'secret_hash'>[]> {
  const db = createAdminClient()

  const { data, error } = await db
    .from('api_keys')
    .select('id, application_id, name, key_prefix, environment, status, permissions, last_used_at, expires_at, revoked_at, created_at')
    .eq('application_id', ctx.application_id)
    .order('created_at', { ascending: false })

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch API keys', 500)

  return (data as unknown as Omit<ApiKey, 'secret_hash'>[]) ?? []
}

export async function revokeApiKey(
  data: RevokeApiKeyData,
  ctx: ApiKeyContext,
): Promise<void> {
  const db = createAdminClient()

  const { error } = await db
    .from('api_keys')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
    })
    .eq('id', data.api_key_id)
    .eq('application_id', ctx.application_id)

  if (error) throw new FlowError(ErrorCode.INTERNAL_ERROR, 'Failed to revoke API key', 500)
}
