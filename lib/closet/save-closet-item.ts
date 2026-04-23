import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizeClosetFields } from '@/lib/closet/taxonomy'
import type { ClosetAnalysisDraft } from '@/lib/closet/types'

type SaveClosetItemInput = ClosetAnalysisDraft & {
  userId: string
}

export async function saveClosetItem(input: SaveClosetItemInput) {
  const supabase = await createSupabaseServerClient()
  const { userId, imageUrl, styleTags } = input
  const normalized = normalizeClosetFields(input)

  const { data, error } = await supabase
    .from('items')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      category: normalized.category,
      sub_category: normalized.subCategory,
      color_category: normalized.colorCategory,
      style_tags: styleTags
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data
}
