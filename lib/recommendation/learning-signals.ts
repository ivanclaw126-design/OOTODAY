import type { ClosetItemCardData } from '@/lib/closet/types'
import { normalizeInput } from '@/lib/closet/taxonomy'
import type { EvaluatedOutfit } from '@/lib/recommendation/outfit-evaluator'
import type { RecommendationInteractionEventType, RecommendationSurface } from '@/lib/recommendation/canonical-types'

export type RecommendationLearningSignalType =
  | 'user_item_context'
  | 'item_pair'
  | 'color'
  | 'silhouette'
  | 'hidden_item'

export type RecommendationLearningSignal = {
  type: RecommendationLearningSignalType
  entityKey: string
  relatedEntityKey?: string | null
  contextKey?: string | null
  value: number
  weight: number
  sourceEventType?: RecommendationInteractionEventType | string | null
}

export type RecommendationLearningSignalRow = {
  signal_type: RecommendationLearningSignalType | string
  entity_key: string
  related_entity_key: string | null
  context_key: string | null
  value: number | string
  weight: number | string
  source_event_type: string | null
}

type RecommendationLikeItem = {
  id?: string | null
  colorCategory?: string | null
  algorithmMeta?: {
    silhouette?: string[] | null
  } | null
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function toNumber(value: number | string | null | undefined, fallback: number) {
  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function selectedItems(outfit: EvaluatedOutfit) {
  return [
    outfit.dress ?? null,
    outfit.top ?? null,
    outfit.bottom ?? null,
    outfit.outerLayer ?? null,
    outfit.shoes ?? null,
    outfit.bag ?? null,
    ...(outfit.accessories ?? [])
  ].filter((item): item is ClosetItemCardData => item !== null)
}

function normalizeSignalType(value: string): RecommendationLearningSignalType | null {
  if (
    value === 'user_item_context' ||
    value === 'item_pair' ||
    value === 'color' ||
    value === 'silhouette' ||
    value === 'hidden_item'
  ) {
    return value
  }

  return null
}

export function normalizeLearningSignalRows(rows: RecommendationLearningSignalRow[] | null | undefined): RecommendationLearningSignal[] {
  return (rows ?? []).reduce<RecommendationLearningSignal[]>((signals, row) => {
    const type = normalizeSignalType(row.signal_type)

    if (!type || !row.entity_key) {
      return signals
    }

    signals.push({
      type,
      entityKey: row.entity_key,
      relatedEntityKey: row.related_entity_key,
      contextKey: row.context_key,
      value: clamp(toNumber(row.value, 0), -1, 1),
      weight: clamp(toNumber(row.weight, 1), 0, 3),
      sourceEventType: row.source_event_type
    })
    return signals
  }, [])
}

export function getInteractionLearningValue(eventType: RecommendationInteractionEventType, rating?: number | null) {
  if (eventType === 'skipped') {
    return -0.03
  }

  if (eventType === 'opened') {
    return 0.04
  }

  if (eventType === 'saved') {
    return 0.28
  }

  if (eventType === 'worn') {
    return 0.38
  }

  if (eventType === 'rated_good') {
    return rating && rating >= 4 ? 0.45 : 0.18
  }

  if (eventType === 'repeated') {
    return 0.5
  }

  if (eventType === 'replaced_item') {
    return -0.24
  }

  if (eventType === 'disliked') {
    return -0.38
  }

  if (eventType === 'hidden_item') {
    return -1
  }

  return 0
}

export function buildInteractionLearningSignals({
  surface,
  eventType,
  itemIds,
  contextKey = null,
  rating = null
}: {
  surface: RecommendationSurface
  eventType: RecommendationInteractionEventType
  itemIds: string[]
  contextKey?: string | null
  rating?: number | null
}): RecommendationLearningSignal[] {
  const value = getInteractionLearningValue(eventType, rating)

  if (value === 0 || itemIds.length === 0 || eventType === 'exposed') {
    return []
  }

  const uniqueItemIds = [...new Set(itemIds)]
  const signals: RecommendationLearningSignal[] = uniqueItemIds.map((itemId) => ({
    type: eventType === 'hidden_item' ? 'hidden_item' : 'user_item_context',
    entityKey: itemId,
    contextKey: contextKey ?? surface,
    value,
    weight: eventType === 'hidden_item' ? 3 : eventType === 'skipped' ? 0.4 : 1,
    sourceEventType: eventType
  }))

  for (let index = 0; index < uniqueItemIds.length; index += 1) {
    for (const relatedIndex of uniqueItemIds.slice(index + 1)) {
      signals.push({
        type: 'item_pair',
        entityKey: uniqueItemIds[index],
        relatedEntityKey: relatedIndex,
        contextKey: contextKey ?? surface,
        value: clamp(value * 0.7, -1, 1),
        weight: eventType === 'skipped' ? 0.35 : 0.8,
        sourceEventType: eventType
      })
    }
  }

  return signals
}

function recommendationSnapshotItems(snapshot: unknown): RecommendationLikeItem[] {
  if (!snapshot || typeof snapshot !== 'object') {
    return []
  }

  const value = snapshot as Record<string, unknown>
  return [
    value.dress,
    value.top,
    value.bottom,
    value.outerLayer,
    value.shoes,
    value.bag,
    ...(Array.isArray(value.accessories) ? value.accessories : [])
  ].filter((item): item is RecommendationLikeItem => Boolean(item) && typeof item === 'object')
}

export function buildFeedbackLearningSignals({
  recommendationSnapshot,
  rating,
  reasonTags,
  contextKey = 'today'
}: {
  recommendationSnapshot: unknown
  rating: number
  reasonTags: string[]
  contextKey?: string
}): RecommendationLearningSignal[] {
  const signal = clamp((rating - 3) / 2, -1, 1)
  const tags = new Set(reasonTags)
  const items = recommendationSnapshotItems(recommendationSnapshot)
  const colorMultiplier = tags.has('like_color') || tags.has('dislike_color') ? 1 : 0.45
  const silhouetteMultiplier = tags.has('like_silhouette') || tags.has('dislike_silhouette') ? 1 : 0.45
  const colorDirection = tags.has('dislike_color') ? -Math.abs(signal || 0.35) : signal
  const silhouetteDirection = tags.has('dislike_silhouette') ? -Math.abs(signal || 0.35) : signal
  const signals: RecommendationLearningSignal[] = []

  for (const item of items) {
    if (item.colorCategory) {
      signals.push({
        type: 'color',
        entityKey: item.colorCategory,
        contextKey,
        value: clamp(colorDirection * 0.24 * colorMultiplier, -0.35, 0.35),
        weight: 1,
        sourceEventType: rating >= 4 ? 'rated_good' : 'disliked'
      })
    }

    for (const silhouette of item.algorithmMeta?.silhouette ?? []) {
      signals.push({
        type: 'silhouette',
        entityKey: silhouette,
        contextKey,
        value: clamp(silhouetteDirection * 0.2 * silhouetteMultiplier, -0.3, 0.3),
        weight: 1,
        sourceEventType: rating >= 4 ? 'rated_good' : 'disliked'
      })
    }
  }

  return signals.filter((item) => item.value !== 0)
}

function signalMatchesContext(signal: RecommendationLearningSignal, contextKeys: string[]) {
  return !signal.contextKey || contextKeys.length === 0 || contextKeys.includes(signal.contextKey)
}

export function hasHiddenItemSignal(outfit: EvaluatedOutfit, signals: RecommendationLearningSignal[] | null | undefined) {
  if (!signals?.length) {
    return false
  }

  const itemIds = new Set(selectedItems(outfit).map((item) => item.id))
  return signals.some((signal) => signal.type === 'hidden_item' && itemIds.has(signal.entityKey) && signal.value < 0)
}

export function getLearningSignalScoreAdjustment({
  outfit,
  signals,
  contextKeys = []
}: {
  outfit: EvaluatedOutfit
  signals?: RecommendationLearningSignal[] | null
  contextKeys?: string[]
}) {
  if (!signals?.length) {
    return 0
  }

  const items = selectedItems(outfit)
  const itemIds = new Set(items.map((item) => item.id))
  const colorKeys = new Set(items.map((item) => normalizeInput(item.colorCategory ?? '')).filter(Boolean))
  const silhouetteKeys = new Set(items.flatMap((item) => item.algorithmMeta?.silhouette ?? []).map(normalizeInput))
  let adjustment = 0

  for (const signal of signals) {
    if (!signalMatchesContext(signal, contextKeys)) {
      continue
    }

    const contribution = signal.value * signal.weight

    if (signal.type === 'user_item_context' && itemIds.has(signal.entityKey)) {
      adjustment += contribution * 4
    }

    if (signal.type === 'item_pair' && itemIds.has(signal.entityKey) && signal.relatedEntityKey && itemIds.has(signal.relatedEntityKey)) {
      adjustment += contribution * 5
    }

    if (signal.type === 'color' && colorKeys.has(normalizeInput(signal.entityKey))) {
      adjustment += contribution * 6
    }

    if (signal.type === 'silhouette' && silhouetteKeys.has(normalizeInput(signal.entityKey))) {
      adjustment += contribution * 5
    }
  }

  return clamp(adjustment, -8, 8)
}
