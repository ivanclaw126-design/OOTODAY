import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ClosetAnalysisDraft } from '@/lib/closet/types'

type SaveClosetItemInput = ClosetAnalysisDraft & {
  userId: string
}

export async function saveClosetItem(input: SaveClosetItemInput) {
  const supabase = await createSupabaseServerClient()
  const { userId, imageUrl, category, subCategory, colorCategory, styleTags } = input

  const { data, error } = await supabase
    .from('items')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      category,
      sub_category: subCategory,
      color_category: colorCategory,
      style_tags: styleTags
    })
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data
}
