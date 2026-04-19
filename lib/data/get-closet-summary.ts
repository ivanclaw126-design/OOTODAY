import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getClosetSummary(userId: string) {
  const supabase = await createSupabaseServerClient()
  const { count, error } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return { itemCount: count ?? 0 }
}
