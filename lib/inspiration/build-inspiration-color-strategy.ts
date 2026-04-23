import { buildPaletteColorStrategyNotes } from '@/lib/closet/color-strategy'
import { getOutfitColorRole } from '@/lib/closet/taxonomy'
import type { InspirationBreakdown } from '@/lib/inspiration/types'

export function buildInspirationColorStrategy(breakdown: InspirationBreakdown) {
  const notes = buildPaletteColorStrategyNotes(breakdown.keyItems.map((item) => item.colorHint))

  const accentItem = breakdown.keyItems.find((item) => item.colorHint && getOutfitColorRole(item.colorHint) === 'accent')

  if (accentItem?.label) {
    notes.push(`如果你想复刻得更像，优先保住“${accentItem.label}”这一处重点。`)
  }

  return notes.slice(0, 4)
}
