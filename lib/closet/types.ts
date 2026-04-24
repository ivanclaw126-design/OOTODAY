export type ClosetItemCardData = {
  id: string
  imageUrl: string | null
  imageFlipped?: boolean
  imageOriginalUrl?: string | null
  imageRotationQuarterTurns?: number
  imageRestoreExpiresAt?: string | null
  canRestoreOriginal?: boolean
  category: string
  subCategory: string | null
  colorCategory: string | null
  styleTags: string[]
  purchasePrice?: number | null
  purchaseYear?: string | null
  itemCondition?: string | null
  lastWornDate: string | null
  wearCount: number
  createdAt: string
}

export type ClosetAnalysisResult = {
  category: string
  subCategory: string
  colorCategory: string
  styleTags: string[]
}

export type ClosetAnalysisDraft = ClosetAnalysisResult & {
  imageUrl: string
  purchasePrice?: number | null
  purchaseYear?: string | null
  itemCondition?: string | null
}

export type ClosetDuplicateGroup = {
  id: string
  label: string
  count: number
  itemIds: string[]
  keepItemId: string
  keepLabel: string
  keepReason: string
}

export type ClosetIdleItem = {
  id: string
  label: string
  reason: string
}

export type ClosetMissingBasic = {
  id: string
  label: string
  reason: string
  priority: 'high' | 'medium'
  nextStep: string
}

export type ClosetInsights = {
  duplicateGroups: ClosetDuplicateGroup[]
  idleItems: ClosetIdleItem[]
  missingBasics: ClosetMissingBasic[]
  actionPlan: ClosetActionItem[]
}

export type ClosetActionItem = {
  id: string
  title: string
  detail: string
  filterId: string
  tone: 'keep' | 'review' | 'buy'
}
