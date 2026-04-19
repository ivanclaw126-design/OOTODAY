import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function ensureProfile(userId: string) {
  const supabase = await createSupabaseServerClient()

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existingProfile) {
    return
  }

  await supabase.from('profiles').insert({ id: userId })
}
