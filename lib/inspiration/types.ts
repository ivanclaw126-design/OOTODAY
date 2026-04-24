import type { ClosetItemCardData } from '@/lib/closet/types'

export type InspirationKeyItem = {
  id: string
  label: string
  category: string
  slot?: string | null
  colorHint: string | null
  silhouette?: string | null
  layerRole?: string | null
  importance?: string | null
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
