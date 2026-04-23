import type { ClosetItemCardData } from '@/lib/closet/types'
import { normalizeCategoryValue } from '@/lib/closet/taxonomy'
import type { InspirationBreakdown, InspirationClosetMatch } from '@/lib/inspiration/types'

function countSharedTags(a: string[], b: string[]) {
  return a.filter((tag) => b.includes(tag)).length
}

export function matchClosetToInspiration(
  breakdown: InspirationBreakdown,
  closetItems: ClosetItemCardData[]
): InspirationClosetMatch[] {
  return breakdown.keyItems.map((inspirationItem) => {
    const normalizedCategory = normalizeCategoryValue(inspirationItem.category)

    const matchedItems = closetItems
      .filter((item) => normalizeCategoryValue(item.category) === normalizedCategory)
      .sort((left, right) => {
        const tagDelta =
          countSharedTags(right.styleTags, inspirationItem.styleTags) -
          countSharedTags(left.styleTags, inspirationItem.styleTags)

        if (tagDelta !== 0) {
          return tagDelta
        }

        return left.wearCount - right.wearCount
      })
      .slice(0, 2)

    return {
      inspirationItem,
      matchedItems
    }
  })
}
