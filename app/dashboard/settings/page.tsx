import React from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import SettingsClient from "./SettingsClient";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const db = createAdminClient()
  const { data: organization } = await db.from('organizations').select('*').limit(1).single()
  const { data: profile } = await db.from('profiles').select('*').limit(1).single()
  const { data: providers } = await db.from('merchant_providers').select('*')

  return <SettingsClient profile={profile} organization={organization} providers={providers || []} />
}

