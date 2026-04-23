import type { ClosetItemCardData } from '@/lib/closet/types'
import { buildPaletteColorStrategyNotes } from '@/lib/closet/color-strategy'
import {
  isBottomCategory,
  isNeutralColor,
  isOnePieceCategory,
  isOuterwearCategory,
  isTopCategory,
  isVividColor,
  scoreColorCompatibility
} from '@/lib/closet/taxonomy'
import type { TodayRecommendation, TodayRecommendationItem, TodayWeather } from '@/lib/today/types'

type RecommendationCandidate = {
  recommendation: TodayRecommendation
  mainIds: string[]
  score: number
}

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

function buildTodayColorNotes(colors: Array<string | null | undefined>) {
  return buildPaletteColorStrategyNotes(colors).map((note) =>
    note
      .replace('这套主要靠同色系深浅变化成立，不是靠大撞色取胜。', '同色系深浅搭配，层次更自然')
      .replace('这套有基础色托底，所以整体看起来更稳、更容易穿进日常。', '用基础色做主轴，整套更稳')
      .replace('基础色占比够高，更容易把少量单品反复穿出稳定组合。', '基础色比例稳，重复穿也不容易乱')
      .replace('同色系单品之间能形成自然轮换，少带几件也不容易显乱。', '同色系轮换更自然，整套层次会更顺')
      .replace('亮点色基本只保留在一处，所以视觉重点会更清楚。', '把亮色控制在一处，重点更清楚')
      .replace('重点色不止一处，使用时记得别让多个亮点同时抢戏。', '重点不止一处，记得别让多个亮点同时抢戏')
      .replace(/。$/, '')
  )
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
  const sharedTag = top.styleTags.find((tag) => bottom.styleTags.includes(tag))

  if (weather?.isWarm) {
    parts.push('天气偏暖，优先轻量组合')
  }

  if (weather?.isCold) {
    parts.push('天气偏冷，建议加一层外套')
  }

  parts.push(...buildTodayColorNotes([top.colorCategory, bottom.colorCategory]))

  if (!parts.some((part) => part.includes('同色系') || part.includes('基础色') || part.includes('亮色'))) {
    const colorScore = scoreColorCompatibility(top.colorCategory, bottom.colorCategory)

    if (colorScore >= 2) {
      parts.push('颜色有呼应，日常直接穿也不容易出错')
    } else if (colorScore === 1) {
      parts.push('配色更有存在感，适合想要一点变化')
    } else {
      parts.push('先靠基础轮廓稳住，再用配饰补完成度')
    }
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
    ...buildTodayColorNotes([dress.colorCategory, outerLayer?.colorCategory]),
    isVividColor(dress.colorCategory) ? '主件颜色已经足够有重点，其他部分可以收一收' : '',
    dress.styleTags[0] ? `风格偏${dress.styleTags[0]}` : ''
  ]

  return buildReason(parts)
}

function getWearFreshnessScore(item: ClosetItemCardData) {
  let score = 0

  if (!item.lastWornDate) {
    score += 8
  }

  score += Math.max(0, 4 - item.wearCount)

  return score
}

function buildRecommendationCandidates(items: ClosetItemCardData[], weather: TodayWeather | null) {
  const tops = [...items.filter((item) => isTopCategory(item.category))].sort(compareWearPriority)
  const bottoms = [...items.filter((item) => isBottomCategory(item.category))].sort(compareWearPriority)
  const dresses = [...items.filter((item) => isOnePieceCategory(item.category))].sort(compareWearPriority)
  const outerLayers = [...items.filter((item) => isOuterwearCategory(item.category))].sort(compareWearPriority)
  const candidates: RecommendationCandidate[] = []

  for (const dress of dresses) {
    const matchingOuterLayer = pickBestOuterLayer(dress, outerLayers, weather)
    candidates.push({
      score: 140 + getWearFreshnessScore(dress),
      mainIds: [dress.id],
      recommendation: {
        id: `dress-${dress.id}`,
        reason: buildDressReason(dress, matchingOuterLayer, weather),
        top: null,
        bottom: null,
        dress: toRecommendationItem(dress),
        outerLayer: matchingOuterLayer ? toRecommendationItem(matchingOuterLayer) : null
      }
    })
  }

  for (const top of tops) {
    for (const bottom of bottoms) {
      candidates.push({
        score: 100 + scoreTopBottomPair(top, bottom) * 8 + getWearFreshnessScore(top) + getWearFreshnessScore(bottom),
        mainIds: [top.id, bottom.id],
        recommendation: {
          id: `set-${top.id}-${bottom.id}`,
          reason: buildPairReason(top, bottom, weather),
          top: toRecommendationItem(top),
          bottom: toRecommendationItem(bottom),
          dress: null,
          outerLayer: (() => {
            const matchingOuterLayer = pickBestOuterLayer(top, outerLayers, weather)
            return matchingOuterLayer ? toRecommendationItem(matchingOuterLayer) : null
          })()
        }
      })
    }
  }

  for (const top of tops) {
    candidates.push({
      score: 40 + getWearFreshnessScore(top),
      mainIds: [top.id],
      recommendation: {
        id: `single-${top.id}`,
        reason: buildReason([
          weather?.isWarm ? '天气偏暖，先从轻便上装开始' : '',
          weather?.isCold ? '天气偏冷，建议先补下装或外套再完善整套' : '',
          isVividColor(top.colorCategory) ? '这件颜色存在感更强，后续更适合配基础下装' : '先用基础单品起一套思路',
          '先用已有单品起一套思路'
        ]),
        top: toRecommendationItem(top),
        bottom: null,
        dress: null,
        outerLayer: null
      }
    })
  }

  return candidates.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score
    }

    return left.recommendation.id.localeCompare(right.recommendation.id)
  })
}

function buildRecommendationBatch(candidates: RecommendationCandidate[], offset: number) {
  if (candidates.length === 0) {
    return []
  }

  const windowStart = (Math.max(0, offset) * 3) % candidates.length
  const rotatedCandidates = [...candidates.slice(windowStart), ...candidates.slice(0, windowStart)]
  const selected: TodayRecommendation[] = []
  const usedMainIds = new Set<string>()

  for (const candidate of rotatedCandidates) {
    const conflicts = candidate.mainIds.some((id) => usedMainIds.has(id))

    if (conflicts && rotatedCandidates.length > 3) {
      continue
    }

    selected.push(candidate.recommendation)
    candidate.mainIds.forEach((id) => usedMainIds.add(id))

    if (selected.length === 3) {
      return selected
    }
  }

  for (const candidate of rotatedCandidates) {
    if (selected.some((item) => item.id === candidate.recommendation.id)) {
      continue
    }

    selected.push(candidate.recommendation)

    if (selected.length === 3) {
      return selected
    }
  }

  return selected
}

export function generateTodayRecommendations(
  items: ClosetItemCardData[],
  weather: TodayWeather | null,
  offset = 0
): TodayRecommendation[] {
  const recommendations = buildRecommendationBatch(buildRecommendationCandidates(items, weather), offset)

  while (recommendations.length < 3 && recommendations.length > 0) {
    const seed = recommendations[recommendations.length % Math.max(1, recommendations.length)]
    recommendations.push({
      ...seed,
      id: `${seed.id}-alt-${recommendations.length}`,
      reason: `${seed.reason}，适合换一套思路`
    })
  }

  return recommendations.slice(0, 3)
}
