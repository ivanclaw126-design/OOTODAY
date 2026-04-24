import { getOutfitColorRole, normalizeColorValue } from '@/lib/closet/taxonomy'
import type { InspirationBreakdown, InspirationClosetMatch, InspirationRemixPlan } from '@/lib/inspiration/types'

function describeItem(match: InspirationClosetMatch['matchedItems'][number]) {
  return [match.colorCategory, match.subCategory ?? match.category].filter(Boolean).join(' ')
}

function describeFormulaRole(match: InspirationClosetMatch) {
  return [match.inspirationItem.slot, match.inspirationItem.silhouette, match.inspirationItem.layerRole].filter(Boolean).join(' / ')
}

function fallbackFormula(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback
}

function buildCoverageLabel(matchedCount: number, totalCount: number) {
  if (totalCount === 0) {
    return '先补一张有明确穿搭单品的灵感图'
  }

  if (matchedCount === totalCount) {
    return '复刻完成度高'
  }

  if (matchedCount >= Math.ceil(totalCount / 2)) {
    return '已经能穿出七成感觉'
  }

  if (matchedCount > 0) {
    return '先借到一部分，再补关键缺口'
  }

  return '衣橱还缺关键单品'
}

export function buildInspirationRemixPlan(
  breakdown: InspirationBreakdown,
  closetMatches: InspirationClosetMatch[]
): InspirationRemixPlan {
  const colorFormula = fallbackFormula(breakdown.colorFormula, '保住主色和辅助色关系')
  const silhouetteFormula = fallbackFormula(breakdown.silhouetteFormula, '保住核心轮廓比例')
  const focalPoint = fallbackFormula(breakdown.focalPoint, '关键视觉中心')
  const steps = closetMatches.map((group) => {
    const matchedItem = group.matchedItems[0] ?? null

    return {
      inspirationItem: group.inspirationItem,
      matchedItem,
      note: matchedItem
        ? group.substituteSuggestion
          ? `先用你的${describeItem(matchedItem)}来代替这件${group.inspirationItem.label}。这不是同类单品，但能先保住${describeFormulaRole(group) || '这处穿搭公式'}。`
          : `先用你的${describeItem(matchedItem)}来代替这件${group.inspirationItem.label}。`
        : group.substituteSuggestion
          ? `这件${group.inspirationItem.label}目前还缺接近替代。${group.substituteSuggestion}`
          : `这件${group.inspirationItem.label}目前还缺接近替代，先记成待补位单品。`
    }
  })

  const matchedCount = steps.filter((step) => step.matchedItem).length
  const totalCount = breakdown.keyItems.length
  const missingItems = steps.filter((step) => !step.matchedItem).map((step) => step.inspirationItem)

  return {
    title: '我的版本怎么穿',
    summary:
      totalCount === 0
        ? '这张灵感图还没拆出足够明确的单品，暂时没法拼出稳定复刻方案。'
        : matchedCount === totalCount
          ? `你衣橱里的核心单品已经够用，可以先按“${colorFormula} / ${silhouetteFormula}”直接复刻。`
          : matchedCount === 0
            ? `目前更多是风格参考，先记住视觉中心是“${focalPoint}”，再补关键单品。`
            : `你已经能借到 ${matchedCount} 件核心单品，先穿出“${silhouetteFormula}”，剩下缺口再补。`,
    matchedCount,
    totalCount,
    coverageLabel: (() => {
      const accentItem = breakdown.keyItems.find((item) => item.colorHint && getOutfitColorRole(normalizeColorValue(item.colorHint)) === 'accent')

      if (matchedCount > 0 && accentItem) {
        return `${buildCoverageLabel(matchedCount, totalCount)} · 记得保住 ${accentItem.label} 这处重点`
      }

      return buildCoverageLabel(matchedCount, totalCount)
    })(),
    steps,
    missingItems
  }
}
