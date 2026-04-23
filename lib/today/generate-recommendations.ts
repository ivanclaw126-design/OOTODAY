import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  isBottomCategory,
  isNeutralColor,
  isOnePieceCategory,
  isOuterwearCategory,
  isTopCategory,
  scoreColorCompatibility
} from '@/lib/closet/taxonomy'
import type { TodayRecommendation, TodayRecommendationItem, TodayWeather } from '@/lib/today/types'

function toRecommendationItem(item: ClosetItemCardData): TodayRecommendationItem {
  return {
    id: item.id,
    imageUrl: item.imageUrl,
    category: item.category,
    subCategory: item.subCategory,
    colorCategory: item.colorCategory,
    styleTags: item.styleTags
  }
}

function buildReason(parts: string[]) {
  return parts.filter(Boolean).join('，')
}

function compareWearPriority(a: ClosetItemCardData, b: ClosetItemCardData) {
  if (!a.lastWornDate && !b.lastWornDate) {
    if (a.wearCount !== b.wearCount) {
      return a.wearCount - b.wearCount
    }

    return b.createdAt.localeCompare(a.createdAt)
  }

  if (!a.lastWornDate) {
    return -1
  }

  if (!b.lastWornDate) {
    return 1
  }

  if (a.lastWornDate !== b.lastWornDate) {
    return a.lastWornDate.localeCompare(b.lastWornDate)
  }

  if (a.wearCount !== b.wearCount) {
    return a.wearCount - b.wearCount
  }

  return b.createdAt.localeCompare(a.createdAt)
}

function rotateItems(items: ClosetItemCardData[], offset: number) {
  if (items.length === 0) {
    return []
  }

  const sorted = [...items].sort(compareWearPriority)
  const normalizedOffset = offset % sorted.length

  return [...sorted.slice(normalizedOffset), ...sorted.slice(0, normalizedOffset)]
}

function countSharedStyleTags(a: string[], b: string[]) {
  return a.filter((tag) => b.includes(tag)).length
}

function scoreTopBottomPair(top: ClosetItemCardData, bottom: ClosetItemCardData) {
  const sharedStyleScore = countSharedStyleTags(top.styleTags, bottom.styleTags) * 2
  const colorScore = scoreColorCompatibility(top.colorCategory, bottom.colorCategory)
  const neutralBonus =
    isNeutralColor(top.colorCategory) || isNeutralColor(bottom.colorCategory)
      ? 2
      : 0

  return sharedStyleScore + colorScore + neutralBonus
}

function pickBestBottom(top: ClosetItemCardData, bottoms: ClosetItemCardData[], usedMainIds: Set<string>) {
  return bottoms
    .filter((candidate) => !usedMainIds.has(candidate.id))
    .sort((left, right) => scoreTopBottomPair(top, right) - scoreTopBottomPair(top, left) || compareWearPriority(left, right))[0] ?? null
}

function pickBestOuterLayer(
  mainItem: ClosetItemCardData,
  outerLayers: ClosetItemCardData[],
  weather: TodayWeather | null
) {
  if (!weather?.isCold || outerLayers.length === 0) {
    return null
  }

  return [...outerLayers].sort((left, right) => {
    const colorDelta = scoreColorCompatibility(right.colorCategory, mainItem.colorCategory) - scoreColorCompatibility(left.colorCategory, mainItem.colorCategory)

    if (colorDelta !== 0) {
      return colorDelta
    }

    return compareWearPriority(left, right)
  })[0] ?? null
}

function buildPairReason(top: ClosetItemCardData, bottom: ClosetItemCardData, weather: TodayWeather | null) {
  const parts: string[] = []
  const colorScore = scoreColorCompatibility(top.colorCategory, bottom.colorCategory)
  const sharedTag = top.styleTags.find((tag) => bottom.styleTags.includes(tag))

  if (weather?.isWarm) {
    parts.push('天气偏暖，优先轻量组合')
  }

  if (weather?.isCold) {
    parts.push('天气偏冷，建议加一层外套')
  }

  if (colorScore >= 3) {
    parts.push('颜色关系稳定，适合直接出门')
  } else if (colorScore >= 2) {
    parts.push('颜色有层次，整套不会太平')
  } else if (colorScore === 1) {
    parts.push('配色更有存在感，适合想要一点变化')
  } else {
    parts.push('先靠基础轮廓稳住，再用配饰补完成度')
  }

  if (sharedTag) {
    parts.push(`风格统一在${sharedTag}`)
  } else if (isNeutralColor(top.colorCategory) || isNeutralColor(bottom.colorCategory)) {
    parts.push('中性色打底，容错率更高')
  }

  return buildReason(parts)
}

function buildDressReason(dress: ClosetItemCardData, outerLayer: ClosetItemCardData | null, weather: TodayWeather | null) {
  const parts = [
    weather?.isCold ? '天气偏冷，建议叠加外套' : '一件完成主造型，省决策成本',
    outerLayer && scoreColorCompatibility(dress.colorCategory, outerLayer.colorCategory) >= 2 ? '外层和主件颜色衔接自然' : '',
    dress.styleTags[0] ? `风格偏${dress.styleTags[0]}` : ''
  ]

  return buildReason(parts)
}

export function generateTodayRecommendations(
  items: ClosetItemCardData[],
  weather: TodayWeather | null,
  offset = 0
): TodayRecommendation[] {
  const tops = items.filter((item) => isTopCategory(item.category))
  const bottoms = items.filter((item) => isBottomCategory(item.category))
  const dresses = items.filter((item) => isOnePieceCategory(item.category))
  const outerLayers = [...items.filter((item) => isOuterwearCategory(item.category))].sort(compareWearPriority)

  const recommendations: TodayRecommendation[] = []
  const usedMainIds = new Set<string>()
  const rotatedTops = rotateItems(tops, offset)
  const rotatedBottoms = rotateItems(bottoms, offset)
  const rotatedDresses = rotateItems(dresses, offset)

  for (const dress of rotatedDresses) {
    if (recommendations.length === 3) {
      break
    }

    usedMainIds.add(dress.id)
    const matchingOuterLayer = pickBestOuterLayer(dress, outerLayers, weather)

    recommendations.push({
      id: `dress-${dress.id}`,
      reason: buildDressReason(dress, matchingOuterLayer, weather),
      top: null,
      bottom: null,
      dress: toRecommendationItem(dress),
      outerLayer: matchingOuterLayer ? toRecommendationItem(matchingOuterLayer) : null
    })
  }

  for (const top of rotatedTops) {
    if (recommendations.length === 3) {
      break
    }

    if (usedMainIds.has(top.id)) {
      continue
    }

    const bottom = pickBestBottom(top, rotatedBottoms, usedMainIds)

    if (!bottom) {
      recommendations.push({
        id: `single-${top.id}`,
        reason: buildReason([
          weather?.isWarm ? '天气偏暖，先从轻便上装开始' : '',
          weather?.isCold ? '天气偏冷，建议先补下装或外套再完善整套' : '',
          '先用已有单品起一套思路'
        ]),
        top: toRecommendationItem(top),
        bottom: null,
        dress: null,
        outerLayer: null
      })
      usedMainIds.add(top.id)
      continue
    }

    usedMainIds.add(top.id)
    usedMainIds.add(bottom.id)

    const matchingOuterLayer = pickBestOuterLayer(top, outerLayers, weather)

    recommendations.push({
      id: `set-${top.id}-${bottom.id}`,
      reason: buildPairReason(top, bottom, weather),
      top: toRecommendationItem(top),
      bottom: toRecommendationItem(bottom),
      dress: null,
      outerLayer: matchingOuterLayer ? toRecommendationItem(matchingOuterLayer) : null
    })
  }

  while (recommendations.length < 3 && recommendations.length > 0) {
    const seed = recommendations[recommendations.length % recommendations.length]
    recommendations.push({
      ...seed,
      id: `${seed.id}-alt-${recommendations.length}`,
      reason: `${seed.reason}，适合换一套思路`
    })
  }

  return recommendations.slice(0, 3)
}
