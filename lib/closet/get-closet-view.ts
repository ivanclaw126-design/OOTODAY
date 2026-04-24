import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { ClosetItemCardData } from '@/lib/closet/types'
import { normalizeClosetAlgorithmMeta, normalizeClosetFields } from '@/lib/closet/taxonomy'
import { isRestoreWindowActive, normalizeQuarterTurns } from '@/lib/closet/image-rotation'

type ClosetItemRow = {
  id: string
  image_url: string | null
  image_flipped?: boolean
  image_original_url?: string | null
  image_rotation_quarter_turns?: number | null
  image_restore_expires_at?: string | null
  category: string
  sub_category: string | null
  color_category: string | null
  style_tags: string[]
  algorithm_meta?: unknown
  purchase_price?: number | null
  purchase_year?: string | null
  item_condition?: string | null
  last_worn_date: string | null
  wear_count: number
  created_at: string
}

function mapClosetItems(data: ClosetItemRow[] | null | undefined): ClosetItemCardData[] {
  return (data ?? []).map((item) => {
    const normalized = normalizeClosetFields({
      category: item.category,
      subCategory: item.sub_category,
      colorCategory: item.color_category
    })

    const imageRotationQuarterTurns = normalizeQuarterTurns(item.image_rotation_quarter_turns)
    const canRestoreOriginal =
      Boolean(item.image_original_url) && imageRotationQuarterTurns > 0 && isRestoreWindowActive(item.image_restore_expires_at)

    return {
      id: item.id,
      imageUrl: item.image_url,
      imageFlipped: canRestoreOriginal,
      imageOriginalUrl: item.image_original_url ?? null,
      imageRotationQuarterTurns,
      imageRestoreExpiresAt: item.image_restore_expires_at ?? null,
      canRestoreOriginal,
      category: normalized.category,
      subCategory: normalized.subCategory,
      colorCategory: normalized.colorCategory,
      styleTags: item.style_tags,
      algorithmMeta: normalizeClosetAlgorithmMeta(item.algorithm_meta, {
        category: normalized.category,
        subCategory: normalized.subCategory,
        styleTags: item.style_tags
      }),
      purchasePrice: item.purchase_price ?? null,
      purchaseYear: item.purchase_year ?? null,
      itemCondition: item.item_condition ?? null,
      lastWornDate: item.last_worn_date,
      wearCount: item.wear_count,
      createdAt: item.created_at
    }
  })
}

export async function getClosetView(userId: string, options?: { limit?: number }) {
  const supabase = await createSupabaseServerClient()
  const limit = options?.limit ?? 6

  const baseQueryWithFlip = supabase
    .from('items')
    .select(
      'id, image_url, image_flipped, image_original_url, image_rotation_quarter_turns, image_restore_expires_at, category, sub_category, color_category, style_tags, algorithm_meta, purchase_price, purchase_year, item_condition, last_worn_date, wear_count, created_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const initialResult = await (limit > 0 ? baseQueryWithFlip.limit(limit) : baseQueryWithFlip)
  let rows = initialResult.data as ClosetItemRow[] | null | undefined
  let error = initialResult.error

  if (
    error &&
    /(image_flipped|image_original_url|image_rotation_quarter_turns|image_restore_expires_at|algorithm_meta|purchase_price|purchase_year|item_condition)/i.test(
      error.message
    )
  ) {
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
