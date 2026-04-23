import type { ClosetInsights, ClosetItemCardData, ClosetMissingBasic } from '@/lib/closet/types'
import { isBottomCategory, isNeutralColor, isOuterwearCategory, isTopCategory, normalizeCategoryValue, normalizeInput } from '@/lib/closet/taxonomy'

const DAY_IN_MS = 24 * 60 * 60 * 1000
const BASIC_STYLE_TAGS = ['基础', '简约', '百搭']
const BASIC_TOP_KEYWORDS = ['t恤', 'tee', '衬衫', '针织', '毛衣', '打底']

function describeItem(item: ClosetItemCardData) {
  return [item.colorCategory, item.subCategory ?? item.category].filter(Boolean).join(' ')
}

function readTimestamp(dateLike: string | null) {
  if (!dateLike) {
    return 0
  }

  const parsed = new Date(dateLike)

  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

function isOlderThan(dateLike: string, days: number, now: Date) {
  const parsed = new Date(dateLike)

  if (Number.isNaN(parsed.getTime())) {
    return false
  }

  return now.getTime() - parsed.getTime() >= days * DAY_IN_MS
}

function hasNeutralColor(item: ClosetItemCardData) {
  return isNeutralColor(item.colorCategory)
}

function hasBasicTop(items: ClosetItemCardData[]) {
  return items.some((item) => {
    if (!isTopCategory(item.category)) {
      return false
    }

    const subCategory = normalizeInput(item.subCategory)
    const hasKeyword = BASIC_TOP_KEYWORDS.some((keyword) => subCategory.includes(keyword))
    const hasBasicTag = item.styleTags.some((tag) => BASIC_STYLE_TAGS.some((keyword) => tag.includes(keyword)))

    return hasNeutralColor(item) && (hasKeyword || hasBasicTag)
  })
}

function hasDarkBottom(items: ClosetItemCardData[]) {
  return items.some((item) => isBottomCategory(item.category) && hasNeutralColor(item))
}

function hasLightOuterwear(items: ClosetItemCardData[]) {
  return items.some((item) => isOuterwearCategory(item.category))
}

export function buildClosetInsights(items: ClosetItemCardData[], now = new Date()): ClosetInsights {
  const duplicateMap = new Map<
    string,
    { id: string; label: string; count: number; itemIds: string[]; items: ClosetItemCardData[] }
  >()

  for (const item of items) {
    const label = describeItem(item) || item.category
    const key = [normalizeCategoryValue(item.category), normalizeInput(item.subCategory), normalizeInput(item.colorCategory)].join('::')
    const existing = duplicateMap.get(key)

    if (existing) {
      existing.count += 1
      existing.itemIds.push(item.id)
      existing.items.push(item)
      continue
    }

    duplicateMap.set(key, {
      id: key,
      label,
      count: 1,
      itemIds: [item.id],
      items: [item]
    })
  }

  const duplicateGroups = Array.from(duplicateMap.values())
    .filter((group) => group.count >= 2)
    .map((group) => {
      const keepItem = [...group.items].sort((left, right) => {
        if (right.wearCount !== left.wearCount) {
          return right.wearCount - left.wearCount
        }

        const lastWornDelta = readTimestamp(right.lastWornDate) - readTimestamp(left.lastWornDate)

        if (lastWornDelta !== 0) {
          return lastWornDelta
        }

        return readTimestamp(right.createdAt) - readTimestamp(left.createdAt)
      })[0]

      return {
        id: group.id,
        label: group.label,
        count: group.count,
        itemIds: group.itemIds,
        keepItemId: keepItem.id,
        keepLabel: describeItem(keepItem) || keepItem.category,
        keepReason:
          keepItem.wearCount > 0
            ? `这件已经穿过 ${keepItem.wearCount} 次，说明它更像你真的会反复拿出来穿的版本`
            : '如果都还没穿开，先保留更新、信息更完整的这一件继续观察'
      }
    })
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 3)

  const idleItems = items
    .filter((item) => {
      if (item.wearCount === 0 && isOlderThan(item.createdAt, 14, now)) {
        return true
      }

      if (item.lastWornDate && isOlderThan(item.lastWornDate, 45, now)) {
        return true
      }

      return false
    })
    .sort((left, right) => left.wearCount - right.wearCount || left.createdAt.localeCompare(right.createdAt))
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      label: describeItem(item) || item.category,
      reason:
        item.wearCount === 0
          ? '收录后还没真正穿出去过'
          : `距离上次穿着已经超过 45 天`
    }))

  const missingBasics: ClosetMissingBasic[] = []

  if (!hasBasicTop(items)) {
    missingBasics.push({
      id: 'basic-top',
      label: '基础中性色上衣',
      reason: '日常推荐、灵感复刻和购买分析都更需要一件能反复搭配的打底上衣',
      priority: 'high',
      nextStep: '优先补一件黑、白、灰或米色的基础上衣，先把日常搭配盘活'
    })
  }

  if (!hasDarkBottom(items)) {
    missingBasics.push({
      id: 'dark-bottom',
      label: '深色基础下装',
      reason: '现在下装覆盖偏弱，补一条深色裤装或半裙会更容易撑起通勤和日常搭配',
      priority: 'high',
      nextStep: '优先补黑色或深灰下装，它会比继续买上衣更快提高整套搭配成功率'
    })
  }

  if (!hasLightOuterwear(items)) {
    missingBasics.push({
      id: 'outerwear',
      label: '可叠穿外套',
      reason: '天气变化和层次搭配都需要一件外套来做切换',
      priority: 'medium',
      nextStep: '等基础上衣和下装更稳后，再补一件好叠穿的外套会更划算'
    })
  }

  const actionPlan = [
    ...missingBasics.map((item) => ({
      id: `action:${item.id}`,
      title: `先补 ${item.label}`,
      detail: item.nextStep,
      filterId: item.id,
      tone: 'buy' as const,
      sortKey: item.priority === 'high' ? 0 : 1
    })),
    ...duplicateGroups.map((group) => ({
      id: `action:${group.id}`,
      title: `重复款先保留 ${group.keepLabel}`,
      detail: `${group.keepReason} 其余 ${group.count - 1} 件可以先暂停同类购买，或者后面再决定去留。`,
      filterId: group.id,
      tone: 'keep' as const,
      sortKey: 2
    })),
    ...idleItems.map((item) => ({
      id: `action:${item.id}`,
      title: `复盘 ${item.label}`,
      detail: `${item.reason} 先看看它是不是版型、颜色或使用场景出了问题。`,
      filterId: item.id,
      tone: 'review' as const,
      sortKey: 3
    }))
  ]
    .sort((left, right) => left.sortKey - right.sortKey || left.title.localeCompare(right.title))
    .slice(0, 3)
    .map(({ id, title, detail, filterId, tone }) => ({
      id,
      title,
      detail,
      filterId,
      tone
    }))

  return {
    duplicateGroups,
    idleItems,
    missingBasics,
    actionPlan
  }
}
