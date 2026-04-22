import type { ClosetItemCardData } from '@/lib/closet/types'

export type InspirationKeyItem = {
  id: string
  label: string
  category: string
  colorHint: string | null
  styleTags: string[]
}

export type InspirationBreakdown = {
  summary: string
  scene: string
  vibe: string
  keyItems: InspirationKeyItem[]
  stylingTips: string[]
}

export type InspirationClosetMatch = {
  inspirationItem: InspirationKeyItem
  matchedItems: ClosetItemCardData[]
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
