import type { ClosetItemCardData } from '@/lib/closet/types'
import {
  getOutfitColorRole,
  hasSameColorFamily,
  isNeutralColor,
  isVividColor,
  normalizeColorValue,
  scoreColorCompatibility
} from '@/lib/closet/taxonomy'

function uniqueNormalizedColors(colors: Array<string | null | undefined>) {
  return colors
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeColorValue(value))
    .filter((value, index, values) => value && values.indexOf(value) === index)
}

export function buildPaletteColorStrategyNotes(colors: Array<string | null | undefined>) {
  const normalizedColors = uniqueNormalizedColors(colors)

  if (normalizedColors.length === 0) {
    return []
  }

  const notes: string[] = []
  const neutralCount = normalizedColors.filter((color) => isNeutralColor(color)).length
  const accentCount = normalizedColors.filter((color) => getOutfitColorRole(color) === 'accent').length
  const sameFamilyPairCount = normalizedColors.flatMap((color, index) =>
    normalizedColors.slice(index + 1).filter((candidate) => hasSameColorFamily(color, candidate))
  ).length

  if (normalizedColors.length >= 2) {
    const [firstColor, secondColor] = normalizedColors

    if (firstColor && secondColor && hasSameColorFamily(firstColor, secondColor) && firstColor !== secondColor) {
      notes.push('这套主要靠同色系深浅变化成立，不是靠大撞色取胜。')
    } else if (firstColor && secondColor && scoreColorCompatibility(firstColor, secondColor) >= 3 && neutralCount > 0) {
      notes.push('这套有基础色托底，所以整体看起来更稳、更容易穿进日常。')
    }
  }

  if (neutralCount >= 2) {
    notes.push('基础色占比够高，更容易把少量单品反复穿出稳定组合。')
  }

  if (sameFamilyPairCount >= 2) {
    notes.push('同色系单品之间能形成自然轮换，少带几件也不容易显乱。')
  }

  if (accentCount === 1) {
    notes.push('亮点色基本只保留在一处，所以视觉重点会更清楚。')
  } else if (accentCount > 1) {
    notes.push('重点色不止一处，使用时记得别让多个亮点同时抢戏。')
  }

  return notes.slice(0, 4)
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
    hints.push('这件属于基础色角色，更容易接入现有衣橱做主轴。')
  } else if (candidateRole === 'accent') {
    hints.push('这件颜色存在感更强，更适合做一套里的重点。')
  } else {
    hints.push('这件颜色适合作为过渡层，能帮基础色穿得不那么平。')
  }

  if (sameFamilyCount >= 2) {
    hints.push('你衣橱里已经有同色系可呼应的单品，买回来自然更容易成套。')
  } else if (neutralCount >= 2 && candidateRole !== 'base') {
    hints.push('你衣橱里的基础色够用，能把这件单品稳稳托住。')
  }

  if (isVividColor(normalizedCandidateColor)) {
    hints.push('如果入手它，建议整套只保留这一处亮点。')
  }

  return hints.slice(0, 4)
}
