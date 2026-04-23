import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ClosetItemCardData } from '@/lib/closet/types'

type ClosetItemRow = {
  id: string
  image_url: string | null
  image_flipped?: boolean
  category: string
  sub_category: string | null
  color_category: string | null
  style_tags: string[]
  last_worn_date: string | null
  wear_count: number
  created_at: string
}

function mapClosetItems(data: ClosetItemRow[] | null | undefined): ClosetItemCardData[] {
  return (data ?? []).map((item) => ({
    id: item.id,
    imageUrl: item.image_url,
    imageFlipped: Boolean(item.image_flipped),
    category: item.category,
    subCategory: item.sub_category,
    colorCategory: item.color_category,
    styleTags: item.style_tags,
    lastWornDate: item.last_worn_date,
    wearCount: item.wear_count,
    createdAt: item.created_at
  }))
}

export async function getClosetView(userId: string, options?: { limit?: number }) {
  const supabase = await createSupabaseServerClient()
  const limit = options?.limit ?? 6

  const baseQueryWithFlip = supabase
    .from('items')
    .select('id, image_url, image_flipped, category, sub_category, color_category, style_tags, last_worn_date, wear_count, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const initialResult = await (limit > 0 ? baseQueryWithFlip.limit(limit) : baseQueryWithFlip)
  let rows = initialResult.data as ClosetItemRow[] | null | undefined
  let error = initialResult.error

  if (error && /image_flipped/i.test(error.message)) {
    const fallbackQuery = supabase
      .from('items')
      .select('id, image_url, category, sub_category, color_category, style_tags, last_worn_date, wear_count, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const fallbackResult = await (limit > 0 ? fallbackQuery.limit(limit) : fallbackQuery)
    rows = fallbackResult.data as ClosetItemRow[] | null | undefined
    error = fallbackResult.error
  }

  if (error) {
    throw error
  }

  const items = mapClosetItems(rows)

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
