import { buildClosetInsights } from '@/lib/closet/build-closet-insights'
import type { ClosetItemCardData } from '@/lib/closet/types'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getClosetInsights(userId: string) {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('items')
    .select('id, image_url, category, sub_category, color_category, style_tags, last_worn_date, wear_count, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

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

  return buildClosetInsights(items)
}
