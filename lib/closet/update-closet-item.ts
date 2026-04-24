import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizeClosetAlgorithmMeta, normalizeClosetFields } from '@/lib/closet/taxonomy'
import type { ClosetAnalysisDraft } from '@/lib/closet/types'
import type { Json } from '@/types/database'

type UpdateClosetItemInput = ClosetAnalysisDraft & {
  userId: string
  itemId: string
}

export async function updateClosetItem(input: UpdateClosetItemInput) {
  const supabase = await createSupabaseServerClient()
  const { userId, itemId, category, subCategory, colorCategory, styleTags, purchasePrice, purchaseYear, itemCondition } = input
  const normalized = normalizeClosetFields({ category, subCategory, colorCategory })
  const algorithmMeta = normalizeClosetAlgorithmMeta(input.algorithmMeta, {
    category: normalized.category,
    subCategory: normalized.subCategory,
    styleTags
  }) as Json

  let { data, error } = await supabase
    .from('items')
    .update({
      category: normalized.category,
      sub_category: normalized.subCategory,
      color_category: normalized.colorCategory,
      style_tags: styleTags,
      algorithm_meta: algorithmMeta,
      purchase_price: purchasePrice ?? null,
      purchase_year: purchaseYear ?? null,
      item_condition: itemCondition ?? null
    })
    .eq('user_id', userId)
    .eq('id', itemId)
    .select('id')
    .single()

  if (error && /(algorithm_meta|purchase_price|purchase_year|item_condition)/i.test(error.message)) {
    const fallbackResult = await supabase
      .from('items')
      .update({
        category: normalized.category,
        sub_category: normalized.subCategory,
        color_category: normalized.colorCategory,
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
