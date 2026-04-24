export type ClosetAlgorithmSlot = 'top' | 'bottom' | 'onePiece' | 'outerwear' | 'shoes' | 'bag' | 'accessory'

export type ClosetAlgorithmLayerRole = 'base' | 'mid' | 'outer' | 'statement' | 'support'

export type ClosetAlgorithmScale = 0 | 1 | 2 | 3 | 4 | 5

export type ClosetAlgorithmFabricWeight = 'light' | 'medium' | 'heavy'

export type ClosetAlgorithmPattern = 'solid' | 'stripe' | 'check' | 'floral' | 'graphic' | 'logo' | 'other'

export type ClosetAlgorithmMeta = {
  slot?: ClosetAlgorithmSlot
  layerRole?: ClosetAlgorithmLayerRole
  silhouette?: string[]
  length?: string
  material?: string[]
  fabricWeight?: ClosetAlgorithmFabricWeight
  formality?: ClosetAlgorithmScale
  warmthLevel?: ClosetAlgorithmScale
  comfortLevel?: ClosetAlgorithmScale
  visualWeight?: ClosetAlgorithmScale
  pattern?: ClosetAlgorithmPattern
}

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
  algorithmMeta?: ClosetAlgorithmMeta | null
  lastWornDate: string | null
  wearCount: number
  createdAt: string
}

export type ClosetAnalysisResult = {
  category: string
  subCategory: string
  colorCategory: string
  styleTags: string[]
  algorithmMeta?: ClosetAlgorithmMeta | null
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
