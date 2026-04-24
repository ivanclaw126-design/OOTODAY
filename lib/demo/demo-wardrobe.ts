import demoWardrobe from '@/data/demo-wardrobe.json'
import type { ClosetAlgorithmMeta } from '@/lib/closet/types'

export type DemoWardrobeItem = {
  slug: string
  label: string
  category: string
  subCategory: string
  colorCategory: string
  styleTags: string[]
  seasonTags: string[]
  purchasePrice: number
  purchaseYear: string
  itemCondition: string
  wearCount: number
  lastWornDate: string | null
  algorithmMeta: ClosetAlgorithmMeta
}

export type DemoWardrobeManifest = {
  version: number
  persona: string
  brand: string
  items: DemoWardrobeItem[]
}

export const DEMO_WARDROBE = demoWardrobe as DemoWardrobeManifest
export const DEMO_WARDROBE_ITEMS = DEMO_WARDROBE.items
export const DEMO_WARDROBE_BRAND = DEMO_WARDROBE.brand

