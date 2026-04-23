import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getClosetItem(userId: string, itemId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('items')
    .select('id, image_url, category, sub_category, color_category, style_tags')
    .eq('user_id', userId)
    .eq('id', itemId)
    .single()

  if (error) {
    throw error
  }

  return data
}
