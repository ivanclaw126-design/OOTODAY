import { getRestoreExpiresAt, isRestoreWindowActive, normalizeQuarterTurns } from '@/lib/closet/image-rotation'
import { normalizeClosetAlgorithmMeta, normalizeClosetFields } from '@/lib/closet/taxonomy'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ClosetAnalysisDraft } from '@/lib/closet/types'
import type { Json } from '@/types/database'

type ReplaceClosetItemImageInput = ClosetAnalysisDraft & {
  userId: string
  itemId: string
}

type ClosetImageReplacementRow = {
  image_url: string | null
  image_original_url?: string | null
  image_rotation_quarter_turns?: number | null
  image_restore_expires_at?: string | null
}

export async function replaceClosetItemImage(input: ReplaceClosetItemImageInput) {
  const supabase = await createSupabaseServerClient()
  const { userId, itemId, imageUrl, category, subCategory, colorCategory, styleTags, purchasePrice, purchaseYear, itemCondition } = input
  const normalized = normalizeClosetFields({ category, subCategory, colorCategory })
  const algorithmMeta = normalizeClosetAlgorithmMeta(input.algorithmMeta, {
    category: normalized.category,
    subCategory: normalized.subCategory,
    styleTags
  }) as Json

  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('image_url, image_original_url, image_rotation_quarter_turns, image_restore_expires_at')
    .eq('user_id', userId)
    .eq('id', itemId)
    .single()

  let currentItem = item as ClosetImageReplacementRow | null
  let currentItemError = itemError

  if (currentItemError && /(image_original_url|image_rotation_quarter_turns|image_restore_expires_at)/i.test(currentItemError.message)) {
    const fallbackResult = await supabase.from('items').select('image_url').eq('user_id', userId).eq('id', itemId).single()
    currentItem = fallbackResult.data as ClosetImageReplacementRow | null
    currentItemError = fallbackResult.error
  }

  if (currentItemError) {
    throw currentItemError
  }

  const now = new Date()
  const hadActiveRestoreWindow = isRestoreWindowActive(currentItem?.image_restore_expires_at, now)
  const previousImageUrl = hadActiveRestoreWindow ? currentItem?.image_original_url ?? currentItem?.image_url ?? null : currentItem?.image_url ?? null
  const nextRestoreExpiresAt = previousImageUrl ? getRestoreExpiresAt(now) : null

  const { data, error } = await supabase
    .from('items')
    .update({
      image_url: imageUrl,
      image_flipped: Boolean(previousImageUrl),
      image_original_url: previousImageUrl,
      image_rotation_quarter_turns: previousImageUrl ? 1 : 0,
      image_restore_expires_at: nextRestoreExpiresAt,
      category: normalized.category,
      sub_category: normalized.subCategory,
      color_category: normalized.colorCategory,
      style_tags: styleTags,
      algorithm_meta: algorithmMeta,
      purchase_price: purchasePrice ?? null,
      purchase_year: purchaseYear ?? null,
      item_condition: itemCondition ?? null,
      updated_at: now.toISOString()
    })
    .eq('user_id', userId)
    .eq('id', itemId)
    .select('id, image_url, image_original_url, image_rotation_quarter_turns, image_restore_expires_at')
    .single()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    imageUrl: data.image_url,
    imageFlipped: Boolean(data.image_original_url),
    imageOriginalUrl: data.image_original_url ?? null,
    imageRotationQuarterTurns: normalizeQuarterTurns(data.image_rotation_quarter_turns),
    imageRestoreExpiresAt: data.image_restore_expires_at ?? null,
    canRestoreOriginal: Boolean(data.image_original_url),
    persisted: true as const
  }
}
