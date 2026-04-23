import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ClosetItemCardData } from '@/lib/closet/types'

export async function getClosetView(userId: string, options?: { limit?: number }) {
  const supabase = await createSupabaseServerClient()
  const limit = options?.limit ?? 6

  function buildBaseQuery(withImageFlip: boolean) {
    return supabase
      .from('items')
      .select(
        withImageFlip
          ? 'id, image_url, image_flipped, category, sub_category, color_category, style_tags, last_worn_date, wear_count, created_at'
          : 'id, image_url, category, sub_category, color_category, style_tags, last_worn_date, wear_count, created_at'
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  }

  let query = buildBaseQuery(true)

  if (limit > 0) {
    query = query.limit(limit)
  }

  let { data, error } = await query

  if (error && /image_flipped/i.test(error.message)) {
    let fallbackQuery = buildBaseQuery(false)

    if (limit > 0) {
      fallbackQuery = fallbackQuery.limit(limit)
    }

    const fallbackResult = await fallbackQuery
    data = fallbackResult.data
    error = fallbackResult.error
  }

  if (error) {
    throw error
  }

  const items: ClosetItemCardData[] = (data ?? []).map((item) => ({
    id: item.id,
    imageUrl: item.image_url,
    imageFlipped: 'image_flipped' in item ? Boolean(item.image_flipped) : false,
    category: item.category,
    subCategory: item.sub_category,
    colorCategory: item.color_category,
    styleTags: item.style_tags,
    lastWornDate: item.last_worn_date,
    wearCount: item.wear_count,
    createdAt: item.created_at
  }))

  if (limit === 0) {
    return {
      itemCount: items.length,
      items
    }
  }

  const { count, error: countError } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    throw countError
  }

  return {
    itemCount: count ?? items.length,
    items
  }
}
