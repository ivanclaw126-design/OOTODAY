import type { ClosetItemCardData } from '@/lib/closet/types'
import type { TodayWeather } from '@/lib/today/types'

export type TravelScene = '通勤' | '休闲' | '正式' | '约会' | '户外'

export type TravelPackingSlot =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'comfortShoes'
  | 'formalShoes'
  | 'backupShoes'
  | 'bags'

export type TravelPackingEntry = {
  id: string
  slot?: TravelPackingSlot
  categoryLabel: string
  quantity: number
  itemLabels: string[]
  selectedItems: ClosetItemCardData[]
  reason: string
}

export type TravelPackingPlan = {
  destinationCity: string
  days: number
  scenes: TravelScene[]
  suggestedOutfitCount: number
  weather: TodayWeather | null
  entries: TravelPackingEntry[]
  dailyPlan: TravelDailyPlanEntry[]
  missingHints: string[]
  notes: string[]
}

export type TravelDailyPlanEntry = {
  dayLabel: string
  outfitSummary: string
  shoeSummary?: string | null
  bagSummary?: string | null
  focus: string
  selectedItems: ClosetItemCardData[]
}

export type TravelSavedPlan = {
  id: string
  title: string
  destinationCity: string
  days: number
  scenes: TravelScene[]
  weatherSummary: string | null
  createdAt: string
  source: TravelSavedPlanSource
}

export type TravelSavedPlanSource = 'travel_plans' | 'outfits'

export type TravelSavedPlanSnapshot = TravelSavedPlan & {
  plan: TravelPackingPlan
}

export type TravelPackingView =
  | {
      status: 'empty-closet'
      itemCount: number
      destinationCity: string | null
      days: number | null
      scenes: TravelScene[]
      savedPlanId: string | null
    }
  | {
      status: 'idle'
      itemCount: number
      destinationCity: string | null
      days: number | null
      scenes: TravelScene[]
      savedPlanId: string | null
    }
  | {
      status: 'ready'
      itemCount: number
      destinationCity: string
      days: number
      scenes: TravelScene[]
      plan: TravelPackingPlan
      recentSavedPlans: TravelSavedPlan[]
      justSaved: boolean
      justUpdated: boolean
      savedPlanId: string | null
      editingSavedPlan: TravelSavedPlan | null
    }

export type TravelPlannerInput = {
  destinationCity: string
  days: number
  scenes: TravelScene[]
  items: ClosetItemCardData[]
  weather: TodayWeather | null
}
