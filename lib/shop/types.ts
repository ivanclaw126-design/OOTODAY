import type { ClosetAnalysisResult, ClosetItemCardData } from '@/lib/closet/types'
import type { RecommendationScoreBreakdown } from '@/lib/recommendation/canonical-types'

export type ShopCandidateItem = ClosetAnalysisResult & {
  imageUrl: string
  imageCandidates: string[]
  sourceUrl: string
  sourceTitle: string | null
}

export type ShopPurchaseRecommendation = 'buy' | 'consider' | 'skip'

export type ShopWardrobeGapType =
  | 'coreOutfit'
  | 'shoeFinisher'
  | 'sceneBag'
  | 'visualFocus'
  | 'styleReinforcement'
  | null

export type ShopPurchaseAnalysis = {
  candidate: ShopCandidateItem
  duplicateItems: ClosetItemCardData[]
  duplicateRisk: 'low' | 'medium' | 'high'
  estimatedOutfitCount: number
  unlocksOutfitCount: number
  completesIncompleteOutfitCount: number
  fillsWardrobeGap: boolean
  gapType: ShopWardrobeGapType
  missingCategoryHints: string[]
  colorStrategyHints: string[]
  preferenceNotes?: string[]
  scoreBreakdown?: RecommendationScoreBreakdown
  recommendation: ShopPurchaseRecommendation
  recommendationReason: string
}
