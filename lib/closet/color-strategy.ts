import type { ClosetItemCardData } from '@/lib/closet/types'
import { buildRecommendationColorNotes } from '@/lib/recommendation/copy'
import {
  getOutfitColorRole,
  hasSameColorFamily,
  isNeutralColor,
  isVividColor,
  normalizeColorValue,
  scoreColorCompatibility
} from '@/lib/closet/taxonomy'

export function buildPaletteColorStrategyNotes(colors: Array<string | null | undefined>) {
  return buildRecommendationColorNotes(colors)
}

export function buildClosetAnchoredColorHints(
  candidateColor: string | null | undefined,
  closetItems: ClosetItemCardData[]
) {
  const normalizedCandidateColor = normalizeColorValue(candidateColor)

  if (!normalizedCandidateColor) {
    return []
  }

  const hints: string[] = []
  const candidateRole = getOutfitColorRole(normalizedCandidateColor)
  const compatibleClosetItems = closetItems.filter(
    (item) => scoreColorCompatibility(normalizedCandidateColor, item.colorCategory) >= 2
  )
  const sameFamilyCount = compatibleClosetItems.filter((item) =>
    hasSameColorFamily(normalizedCandidateColor, item.colorCategory)
  ).length
  const neutralCount = closetItems.filter((item) => isNeutralColor(item.colorCategory)).length

  if (candidateRole === 'base') {
    hints.push('这件属于基础色角色，更容易接入现有衣橱做主轴，日常容错率高。')
  } else if (candidateRole === 'accent') {
    hints.push('这件颜色存在感更强，更适合做一套里的唯一亮色重点。')
  } else {
    hints.push('这件颜色适合作为过渡层，能帮基础色穿得不那么平。')
  }

  if (sameFamilyCount >= 2) {
    hints.push('你衣橱里已经有同色系可呼应的单品，买回来自然更容易成套。')
  } else if (neutralCount >= 2 && candidateRole !== 'base') {
    hints.push('你衣橱里的基础色够用，能把这件单品稳稳托住。')
  }

  if (isVividColor(normalizedCandidateColor)) {
    hints.push('如果入手它，建议整套只保留这一处亮点，避免多个视觉中心竞争。')
  }

  return hints.slice(0, 4)
}
