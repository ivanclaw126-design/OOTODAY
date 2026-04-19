import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getTodayState(userId: string) {
  const supabase = await createSupabaseServerClient()

  const [{ data: profile }, { count, error }] = await Promise.all([
    supabase.from('profiles').select('id, city').eq('id', userId).maybeSingle(),
    supabase.from('items').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  ])

  if (error) {
    throw error
  }

  return {
    hasProfile: Boolean(profile),
    city: profile?.city ?? null,
    itemCount: count ?? 0
  }
}
