import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ClosetItemCardData } from '@/lib/closet/types'

export async function getClosetView(userId: string) {
  const supabase = await createSupabaseServerClient()

  const { count, error: countError } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    throw countError
  }

  const { data, error } = await supabase
    .from('items')
    .select('id, image_url, category, sub_category, color_category, style_tags, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) {
    throw error
  }

  const items: ClosetItemCardData[] = (data ?? []).map((item) => ({
    id: item.id,
    imageUrl: item.image_url,
    category: item.category,
    subCategory: item.sub_category,
    colorCategory: item.color_category,
    styleTags: item.style_tags,
    createdAt: item.created_at
  }))

  return {
    itemCount: count ?? 0,
    items
  }
}
