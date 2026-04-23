import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ClosetAnalysisDraft } from '@/lib/closet/types'

type UpdateClosetItemInput = ClosetAnalysisDraft & {
  userId: string
  itemId: string
}

export async function updateClosetItem(input: UpdateClosetItemInput) {
  const supabase = await createSupabaseServerClient()
  const { userId, itemId, category, subCategory, colorCategory, styleTags } = input

  const { data, error } = await supabase
    .from('items')
    .update({
      category,
      sub_category: subCategory,
      color_category: colorCategory,
      style_tags: styleTags
    })
    .eq('user_id', userId)
    .eq('id', itemId)
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data
}
