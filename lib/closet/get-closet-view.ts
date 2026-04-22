import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ClosetItemCardData } from '@/lib/closet/types'

export async function getClosetView(userId: string, options?: { limit?: number }) {
  const supabase = await createSupabaseServerClient()
  const limit = options?.limit ?? 6

  const { count, error: countError } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    throw countError
  }

  let query = supabase
    .from('items')
    .select('id, image_url, category, sub_category, color_category, style_tags, last_worn_date, wear_count, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (limit > 0) {
    query = query.limit(limit)
  }

  const { data, error } = await query

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
    lastWornDate: item.last_worn_date,
    wearCount: item.wear_count,
    createdAt: item.created_at
  }))

  return {
    itemCount: count ?? 0,
    items
  }
}
