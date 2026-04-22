export type ClosetItemCardData = {
  id: string
  imageUrl: string | null
  category: string
  subCategory: string | null
  colorCategory: string | null
  styleTags: string[]
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
}
