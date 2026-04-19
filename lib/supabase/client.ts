import { createBrowserClient } from '@supabase/ssr'
import { getEnv } from '@/lib/env'

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = getEnv()

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
