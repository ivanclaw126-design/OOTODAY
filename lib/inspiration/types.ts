import type { ClosetItemCardData } from '@/lib/closet/types'

export type InspirationOutfitSlot = 'top' | 'bottom' | 'onePiece' | 'outerLayer' | 'shoes' | 'bag' | 'accessory'

export type InspirationLayerRole = 'base' | 'mid' | 'outer' | 'statement' | 'support'

export type InspirationImportance = 1 | 2 | 3 | 4 | 5

export type InspirationKeyItem = {
  id: string
  label: string
  category: string
  slot?: InspirationOutfitSlot | null
  colorHint: string | null
  silhouette?: string[]
  layerRole?: InspirationLayerRole | null
  importance?: InspirationImportance | null
  styleTags: string[]
  alternatives?: string[]
}

export type InspirationBreakdown = {
  summary: string
  scene: string
  vibe: string
  colorFormula: string
  silhouetteFormula: string
  layeringFormula: string
  focalPoint: string
  keyItems: InspirationKeyItem[]
  stylingTips: string[]
  colorStrategyNotes: string[]
}

export type InspirationClosetMatch = {
  inspirationItem: InspirationKeyItem
  matchedItems: ClosetItemCardData[]
  matchReason: string
  substituteSuggestion: string | null
  preferenceNote?: string | null
  scoreBreakdown?: InspirationMatchScoreBreakdown
}

export type InspirationMatchScoreBreakdown = {
  total: number
  categoryScore: number
  slotScore: number
  colorScore: number
  silhouetteScore: number
  styleScore: number
  layerRoleScore: number
  preferenceAdjustment?: number
  distanceFromDailyStyle?: number
  blockedByHardAvoid?: boolean
  matchType: 'sameCategory' | 'formulaSubstitute' | 'missing'
}

export type InspirationRemixStep = {
  inspirationItem: InspirationKeyItem
  matchedItem: ClosetItemCardData | null
  note: string
}

export type InspirationRemixPlan = {
  title: string
  summary: string
  matchedCount: number
  totalCount: number
  coverageLabel: string
  steps: InspirationRemixStep[]
  missingItems: InspirationKeyItem[]
}

export type InspirationAnalysis = {
  sourceUrl: string
  sourceTitle: string | null
  imageUrl: string
  breakdown: InspirationBreakdown
  closetMatches: InspirationClosetMatch[]
  remixPlan: InspirationRemixPlan
}
