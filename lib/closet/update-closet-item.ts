import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ClosetAnalysisDraft } from '@/lib/closet/types'

type UpdateClosetItemInput = ClosetAnalysisDraft & {
  userId: string
  itemId: string
}

export async function updateClosetItem(input: UpdateClosetItemInput) {
  const supabase = await createSupabaseServerClient()
  const { userId, itemId, category, subCategory, colorCategory, styleTags, purchasePrice, purchaseYear, itemCondition } = input

  let { data, error } = await supabase
    .from('items')
    .update({
      category,
      sub_category: subCategory,
      color_category: colorCategory,
      style_tags: styleTags,
      purchase_price: purchasePrice ?? null,
      purchase_year: purchaseYear ?? null,
      item_condition: itemCondition ?? null
    })
    .eq('user_id', userId)
    .eq('id', itemId)
    .select('id')
    .single()

  if (error && /(purchase_price|purchase_year|item_condition)/i.test(error.message)) {
    const fallbackResult = await supabase
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

    data = fallbackResult.data
    error = fallbackResult.error
  }

  if (error) {
    throw error
  }

  return data
}
