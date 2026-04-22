import type { ClosetItemCardData } from '@/lib/closet/types'
import type { InspirationBreakdown, InspirationClosetMatch } from '@/lib/inspiration/types'

function normalizeCategory(category: string) {
  if (category === '裤子') {
    return '裤装'
  }

  return category
}

function countSharedTags(a: string[], b: string[]) {
  return a.filter((tag) => b.includes(tag)).length
}

export function matchClosetToInspiration(
  breakdown: InspirationBreakdown,
  closetItems: ClosetItemCardData[]
): InspirationClosetMatch[] {
  return breakdown.keyItems.map((inspirationItem) => {
    const normalizedCategory = normalizeCategory(inspirationItem.category)

    const matchedItems = closetItems
      .filter((item) => normalizeCategory(item.category) === normalizedCategory)
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
