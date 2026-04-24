import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getSession() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  return { user: data.user }
}
