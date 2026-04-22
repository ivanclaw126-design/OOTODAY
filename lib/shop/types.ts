import type { ClosetAnalysisResult, ClosetItemCardData } from '@/lib/closet/types'

export type ShopCandidateItem = ClosetAnalysisResult & {
  imageUrl: string
  sourceUrl: string
  sourceTitle: string | null
}

export type ShopPurchaseRecommendation = 'buy' | 'consider' | 'skip'

export type ShopPurchaseAnalysis = {
  candidate: ShopCandidateItem
  duplicateItems: ClosetItemCardData[]
  duplicateRisk: 'low' | 'medium' | 'high'
  estimatedOutfitCount: number
  missingCategoryHints: string[]
  recommendation: ShopPurchaseRecommendation
  recommendationReason: string
}
