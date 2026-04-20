import type { ClosetItemCardData } from '@/lib/closet/types'
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

export function generateTodayRecommendations(
  items: ClosetItemCardData[],
  weather: TodayWeather | null,
  offset = 0
): TodayRecommendation[] {
  const tops = items.filter((item) => item.category === '上衣')
  const bottoms = items.filter((item) => item.category === '裤装' || item.category === '裙装')
  const dresses = items.filter((item) => item.category === '连衣裙')
  const outerLayers = items.filter((item) => item.category === '外套')

  const recommendations: TodayRecommendation[] = []
  const usedMainIds = new Set<string>()
  const rotatedTops = tops.length > 0 ? [...tops.slice(offset % tops.length), ...tops.slice(0, offset % tops.length)] : []
  const rotatedDresses =
    dresses.length > 0
      ? [...dresses.slice(offset % dresses.length), ...dresses.slice(0, offset % dresses.length)]
      : []

  for (const dress of rotatedDresses) {
    if (recommendations.length === 3) {
      break
    }

    usedMainIds.add(dress.id)
    recommendations.push({
      id: `dress-${dress.id}`,
      reason: buildReason([
        weather?.isCold ? '单穿偏冷，建议配外套' : '一件完成搭配',
        dress.styleTags[0] ? `风格偏${dress.styleTags[0]}` : ''
      ]),
      top: null,
      bottom: null,
      dress: toRecommendationItem(dress),
      outerLayer: weather?.isCold && outerLayers[0] ? toRecommendationItem(outerLayers[0]) : null
    })
  }

  for (const top of rotatedTops) {
    if (recommendations.length === 3) {
      break
    }

    if (usedMainIds.has(top.id)) {
      continue
    }

    const bottom = bottoms.find((candidate) => !usedMainIds.has(candidate.id))

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

    const matchingOuterLayer = weather?.isCold && outerLayers.length > 0 ? outerLayers[0] : null
    const sharedTag = top.styleTags.find((tag) => bottom.styleTags.includes(tag))

    recommendations.push({
      id: `set-${top.id}-${bottom.id}`,
      reason: buildReason([
        weather?.isWarm ? '天气偏暖，优先轻量组合' : '',
        weather?.isCold ? '天气偏冷，可叠加外套' : '',
        sharedTag ? `风格统一在${sharedTag}` : '基础组合稳定不出错'
      ]),
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
