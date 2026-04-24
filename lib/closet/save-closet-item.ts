import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizeClosetAlgorithmMeta, normalizeClosetFields } from '@/lib/closet/taxonomy'
import type { ClosetAnalysisDraft } from '@/lib/closet/types'
import type { Json } from '@/types/database'

type SaveClosetItemInput = ClosetAnalysisDraft & {
  userId: string
}

export async function saveClosetItem(input: SaveClosetItemInput) {
  const supabase = await createSupabaseServerClient()
  const { userId, imageUrl, styleTags, purchasePrice, purchaseYear, itemCondition } = input
  const normalized = normalizeClosetFields(input)
  const algorithmMeta = normalizeClosetAlgorithmMeta(input.algorithmMeta, {
    category: normalized.category,
    subCategory: normalized.subCategory,
    styleTags
  }) as Json

  const insertPayload = {
    user_id: userId,
    image_url: imageUrl,
    category: normalized.category,
    sub_category: normalized.subCategory,
    color_category: normalized.colorCategory,
    style_tags: styleTags,
    algorithm_meta: algorithmMeta,
    purchase_price: purchasePrice ?? null,
    purchase_year: purchaseYear ?? null,
    item_condition: itemCondition ?? null
  }

  let { data, error } = await supabase
    .from('items')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error && /(algorithm_meta|purchase_price|purchase_year|item_condition)/i.test(error.message)) {
    const fallbackResult = await supabase
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

    data = fallbackResult.data
    error = fallbackResult.error
  }

  if (error) {
    throw error
  }

  return data
}
