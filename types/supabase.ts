// ============================================================
// Trim Key Flow — Supabase Database Types
// Matches PostgREST GenericSchema and live Supabase schema
// ============================================================

type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<{
        id: string
        full_name: string | null
        phone: string | null
        avatar_url: string | null
        job_title: string | null
        timezone: string | null
        country_code: string | null
        preferred_language: string | null
        is_active: boolean
        created_at: string
        updated_at: string
      }>
      organizations: TableDef<
        {
          id: string
          name: string
          legal_name: string | null
          slug: string
          organization_type: string | null
          status: string
          email: string | null
          phone: string | null
          website_url: string | null
          country_code: string | null
          currency_code: string | null
          timezone: string | null
          logo_url: string | null
          description: string | null
          tax_identifier: string | null
          registration_number: string | null
          metadata: Record<string, unknown> | null
          created_at: string
          updated_at: string
        },
        Record<string, unknown>
      >
      organization_members: TableDef<{
        id: string
        organization_id: string
        user_id: string
        role: string
        is_active: boolean
        joined_at: string | null
        created_at: string
      }>
      applications: TableDef<{
        id: string
        organization_id: string
        name: string
        slug: string
        description: string | null
        status: string
        environment: string | null
        webhook_url: string | null
        metadata: Record<string, unknown> | null
        created_at: string
        updated_at: string
      }>
      application_domains: TableDef<
        {
          id: string
          application_id: string
          domain: string
          is_verified: boolean
          verification_token: string | null
          verified_at: string | null
          created_at: string
        },
        {
          id?: string
          application_id: string
          domain: string
          is_verified?: boolean
          verification_token?: string | null
          verified_at?: string | null
          created_at?: string
        }
      >
      api_keys: TableDef<
        {
          id: string
          application_id: string
          name: string
          key_prefix: string
          secret_hash: string
          environment: string
          status: string
          permissions: string[] | null
          last_used_at: string | null
          expires_at: string | null
          revoked_at: string | null
          created_at: string
        },
        {
          id?: string
          application_id: string
          name: string
          key_prefix: string
          secret_hash: string
          environment: string
          status: string
          permissions: string[] | null
          last_used_at?: string | null
          expires_at?: string | null
          revoked_at?: string | null
          created_at?: string
        }
      >
      merchants: TableDef<{
        id: string
        organization_id: string
        name: string
        display_name: string | null
        status: string
        country_code: string | null
        currency_code: string | null
        metadata: Record<string, unknown> | null
        created_at: string
        updated_at: string
      }>
      merchant_providers: TableDef<{
        id: string
        merchant_id: string
        provider: string
        account_identifier: string | null
        credentials_encrypted: Record<string, unknown> | null
        webhook_secret_encrypted: string | null
        is_active: boolean
        is_default: boolean
        connected_at: string | null
        disconnected_at: string | null
        metadata: Record<string, unknown> | null
        created_at: string
        updated_at: string
      }>
      orders: TableDef<
        {
          id: string
          order_number: string
          application_id: string
          merchant_id: string
          merchant_provider_id: string
          amount: number
          currency_code: string
          purpose: string
          status: string
          provider_order_id: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          idempotency_key: string | null
          metadata: Record<string, unknown> | null
          created_at: string
          updated_at: string
          expires_at: string | null
        },
        {
          id?: string
          order_number: string
          application_id: string
          merchant_id: string
          merchant_provider_id: string
          amount: number
          currency_code: string
          purpose: string
          status: string
          provider_order_id?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          idempotency_key?: string | null
          metadata?: Record<string, unknown> | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      >
      payments: TableDef<
        {
          id: string
          payment_number: string
          order_id: string
          application_id: string
          merchant_id: string
          merchant_provider_id: string
          provider_payment_id: string | null
          amount: number
          currency_code: string
          payment_method: string | null
          status: string
          failure_code: string | null
          failure_reason: string | null
          metadata: Record<string, unknown> | null
          created_at: string
          updated_at: string
          paid_at: string | null
        },
        {
          id?: string
          payment_number: string
          order_id: string
          application_id: string
          merchant_id: string
          merchant_provider_id: string
          provider_payment_id?: string | null
          amount: number
          currency_code: string
          payment_method?: string | null
          status: string
          failure_code?: string | null
          failure_reason?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
          paid_at?: string | null
        }
      >
      refunds: TableDef<
        {
          id: string
          refund_number: string
          payment_id: string
          amount: number
          currency_code: string
          provider_refund_id: string | null
          status: string
          reason: string | null
          metadata: Record<string, unknown> | null
          created_at: string
          updated_at: string
          completed_at: string | null
        },
        {
          id?: string
          refund_number: string
          payment_id: string
          amount: number
          currency_code: string
          provider_refund_id?: string | null
          status: string
          reason?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      >
      webhook_events: TableDef<
        {
          id: string
          provider: string
          provider_event_id: string
          event_type: string
          signature_valid: boolean
          payload: Record<string, unknown>
          processed: boolean
          processing_error: string | null
          received_at: string
          processed_at: string | null
        },
        {
          id?: string
          provider: string
          provider_event_id: string
          event_type: string
          signature_valid: boolean
          payload: Record<string, unknown>
          processed: boolean
          processing_error?: string | null
          received_at: string
          processed_at?: string | null
        }
      >
      webhook_deliveries: TableDef<
        {
          id: string
          webhook_event_id: string
          application_id: string
          endpoint_url: string
          event_type: string
          attempt_number: number
          http_status: number | null
          response_body: string | null
          status: string
          next_retry_at: string | null
          delivered_at: string | null
          created_at: string
        },
        {
          id?: string
          webhook_event_id: string
          application_id: string
          endpoint_url: string
          event_type: string
          attempt_number: number
          http_status?: number | null
          response_body?: string | null
          status: string
          next_retry_at?: string | null
          delivered_at?: string | null
          created_at?: string
        }
      >
      audit_logs: TableDef<
        {
          id: string
          organization_id: string | null
          user_id: string | null
          application_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        },
        {
          id?: string
          organization_id?: string | null
          user_id?: string | null
          application_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
      >
      industries: TableDef<{
        id: string
        name: string
        slug: string
        description: string | null
        parent_id: string | null
        is_active: boolean
        created_at: string
      }>
      organization_industries: TableDef<{
        organization_id: string
        industry_id: string
        is_primary: boolean
        created_at: string
      }>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
