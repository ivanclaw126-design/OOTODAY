import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  isAccessoryCategory,
  isBagCategory,
  isBottomCategory,
  isOnePieceCategory,
  isOuterwearCategory,
  isShoesCategory,
  isTopCategory
} from '@/lib/closet/taxonomy'
import type { CandidateModelScoreMap, EntityModelScoreMap } from '@/lib/recommendation/model-score-storage'
import type { RecommendationLearningSignal } from '@/lib/recommendation/learning-signals'
import type { RecommendationPreferenceState } from '@/lib/recommendation/preference-types'
import type { RecommendationTrendSignal } from '@/lib/recommendation/trends'
import { generateTodayRecommendations } from '@/lib/today/generate-recommendations'
import type {
  TodayRecommendation,
  TodayRecommendationItem,
  TodayReplaceableSlot,
  TodayScene,
  TodayTargetDate,
  TodayWeather
} from '@/lib/today/types'

function selectedRecommendationItems(recommendation: TodayRecommendation) {
  return [
    recommendation.dress,
    recommendation.top,
    recommendation.bottom,
    recommendation.outerLayer,
    recommendation.shoes,
    recommendation.bag,
    ...(recommendation.accessories ?? [])
  ].filter((item): item is TodayRecommendationItem => Boolean(item))
}

function slotItemIds(recommendation: TodayRecommendation, slot: TodayReplaceableSlot) {
  if (slot === 'accessories') {
    return new Set((recommendation.accessories ?? []).map((item) => item.id))
  }

  return new Set([recommendation[slot]?.id].filter((id): id is string => Boolean(id)))
}

function itemMatchesSlot(item: ClosetItemCardData, slot: TodayReplaceableSlot) {
  if (slot === 'top') {
    return isTopCategory(item.category)
  }

  if (slot === 'bottom') {
    return isBottomCategory(item.category)
  }

  if (slot === 'dress') {
    return isOnePieceCategory(item.category)
  }

  if (slot === 'outerLayer') {
    return isOuterwearCategory(item.category)
  }

  if (slot === 'shoes') {
    return isShoesCategory(item.category)
  }

  if (slot === 'bag') {
    return isBagCategory(item.category)
  }

  return isAccessoryCategory(item.category)
}

function sameItem(left: TodayRecommendationItem | null, right: TodayRecommendationItem | null) {
  return (left?.id ?? null) === (right?.id ?? null)
}

function keepsFixedSlots(candidate: TodayRecommendation, base: TodayRecommendation, slot: TodayReplaceableSlot) {
  if (slot !== 'dress' && !sameItem(candidate.dress, base.dress)) {
    return false
  }

  if (slot !== 'top' && !sameItem(candidate.top, base.top)) {
    return false
  }

  if (slot !== 'bottom' && !sameItem(candidate.bottom, base.bottom)) {
    return false
  }

  if (slot !== 'outerLayer' && !sameItem(candidate.outerLayer, base.outerLayer)) {
    return false
  }

  if (slot !== 'shoes' && !sameItem(candidate.shoes, base.shoes)) {
    return false
  }

  if (slot !== 'bag' && !sameItem(candidate.bag, base.bag)) {
    return false
  }

  if (slot !== 'accessories') {
    const baseAccessoryIds = (base.accessories ?? []).map((item) => item.id).join('|')
    const candidateAccessoryIds = (candidate.accessories ?? []).map((item) => item.id).join('|')

    if (baseAccessoryIds !== candidateAccessoryIds) {
      return false
    }
  }

  return true
}

function changedTargetSlot(candidate: TodayRecommendation, base: TodayRecommendation, slot: TodayReplaceableSlot) {
  if (slot === 'accessories') {
    const baseIds = (base.accessories ?? []).map((item) => item.id).join('|')
    const candidateIds = (candidate.accessories ?? []).map((item) => item.id).join('|')

    return baseIds !== candidateIds
  }

  return (candidate[slot]?.id ?? null) !== (base[slot]?.id ?? null)
}

export function replaceRecommendationSlot({
  baseRecommendation,
  slot,
  items,
  weather,
  preferenceState,
  modelScoreMap = {},
  entityModelScoreMap = {},
  trendSignals = [],
  learningSignals = [],
  targetDate = baseRecommendation.targetDate ?? 'today',
  scene = baseRecommendation.scene ?? null,
  rejectedItemIds = []
}: {
  baseRecommendation: TodayRecommendation
  slot: TodayReplaceableSlot
  items: ClosetItemCardData[]
  weather: TodayWeather | null
  preferenceState: RecommendationPreferenceState
  modelScoreMap?: CandidateModelScoreMap
  entityModelScoreMap?: EntityModelScoreMap
  trendSignals?: RecommendationTrendSignal[]
  learningSignals?: RecommendationLearningSignal[]
  targetDate?: TodayTargetDate
  scene?: TodayScene
  rejectedItemIds?: string[]
}): TodayRecommendation | null {
  const rejectedIds = new Set([...rejectedItemIds, ...slotItemIds(baseRecommendation, slot)])
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const fixedItems = selectedRecommendationItems(baseRecommendation)
    .filter((item) => !slotItemIds(baseRecommendation, slot).has(item.id))
    .map((item) => itemsById.get(item.id))
    .filter((item): item is ClosetItemCardData => Boolean(item))
  const alternatives = items.filter((item) => itemMatchesSlot(item, slot) && !rejectedIds.has(item.id))

  if (alternatives.length === 0) {
    return null
  }

  const candidateItems = Array.from(new Map([...fixedItems, ...alternatives].map((item) => [item.id, item])).values())
  const candidates = generateTodayRecommendations({
    items: candidateItems,
    weather,
    offset: 0,
    preferenceState,
    modelScoreMap,
    entityModelScoreMap,
    trendSignals,
    learningSignals,
    targetDate,
    scene
  })
  const replacement = candidates.find((candidate) =>
    keepsFixedSlots(candidate, baseRecommendation, slot) && changedTargetSlot(candidate, baseRecommendation, slot)
  )

  if (!replacement) {
    return null
  }

  return {
    ...replacement,
    id: `${baseRecommendation.id}-replace-${slot}-${replacement.id}`,
    reasonHighlights: replacement.reasonHighlights ?? baseRecommendation.reasonHighlights,
    targetDate,
    scene
  }
}
