import {
  getColorDefinition,
  getOutfitColorRole,
  isNeutralColor,
  normalizeColorValue
} from '@/lib/closet/taxonomy'
import { hasTonalColorRelationship } from '@/lib/recommendation/outfit-evaluator'

export type RecommendationCopySurface = 'today' | 'shop' | 'inspiration' | 'travel' | 'default'
export type RecommendationMissingSlot = 'shoes' | 'bag' | 'accessories' | 'outerLayer'

function uniqueNormalizedColors(colors: Array<string | null | undefined>) {
  return colors
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeColorValue(value))
    .filter((value, index, values) => value && values.indexOf(value) === index)
}

function isFoundationColor(color: string) {
  const definition = getColorDefinition(color)

  if (!definition) {
    return false
  }

  return isNeutralColor(color) || definition.value === '藏蓝色'
}

function countPairs(colors: string[], predicate: (left: string, right: string) => boolean) {
  return colors.flatMap((color, index) => colors.slice(index + 1).filter((candidate) => predicate(color, candidate))).length
}

function surfacePhrase(surface: RecommendationCopySurface, phrase: string) {
  const copy: Record<RecommendationCopySurface, Record<string, string>> = {
    today: {
      foundation: '基础色托底，今天穿起来稳定，日常容错率高。',
      sameFamily: '同色系深浅让层次更自然，不是靠强撞色撑起来。',
      singleAccent: '亮色只放在一处，视觉重点会更清楚。',
      multipleAccent: '多个亮色会让视觉中心竞争，今天穿时建议收掉一处。'
    },
    shop: {
      foundation: '基础色托底，购买后更容易接入日常衣橱，容错率高。',
      sameFamily: '同色系深浅更像自然延伸，不是靠强撞色制造存在感。',
      singleAccent: '如果把它当一处亮色重点，购买价值会更清楚。',
      multipleAccent: '多个亮色会让视觉中心竞争，购买前要确认它不会抢走已有重点。'
    },
    inspiration: {
      foundation: '基础色托底，复刻时先保住稳定底色，日常容错率更高。',
      sameFamily: '同色系深浅是这套的层次来源，不是靠强撞色成立。',
      singleAccent: '一处亮色重点清楚，复刻时别再叠加第二个焦点。',
      multipleAccent: '多个亮色会让视觉中心竞争，复刻时建议只保留一个重点。'
    },
    travel: {
      foundation: '基础色托底，旅行中更稳定，也更容易少带多穿。',
      sameFamily: '同色系深浅能自然做出层次，不需要靠强撞色增加行李复杂度。',
      singleAccent: '只带一处亮色重点最省心，视觉中心也更清楚。',
      multipleAccent: '多个亮色会让视觉中心竞争，打包时建议少带一处亮色。'
    },
    default: {
      foundation: '基础色托底，稳定，日常容错率高。',
      sameFamily: '同色系深浅让层次自然，不是靠强撞色。',
      singleAccent: '一处亮色重点清楚。',
      multipleAccent: '多个亮色会让视觉中心竞争。'
    }
  }

  return copy[surface][phrase] ?? copy.default[phrase] ?? ''
}

export function buildRecommendationColorNotes(
  colors: Array<string | null | undefined>,
  surface: RecommendationCopySurface = 'default'
) {
  const normalizedColors = uniqueNormalizedColors(colors)

  if (normalizedColors.length === 0) {
    return []
  }

  const notes: string[] = []
  const foundationCount = normalizedColors.filter(isFoundationColor).length
  const accentCount = normalizedColors.filter((color) => getOutfitColorRole(color) === 'accent').length
  const sameFamilyPairCount = countPairs(
    normalizedColors,
    (left, right) => left !== right && hasTonalColorRelationship(left, right)
  )

  if (foundationCount >= 2 || (foundationCount >= 1 && normalizedColors.length <= 2)) {
    notes.push(surfacePhrase(surface, 'foundation'))
  }

  if (sameFamilyPairCount > 0) {
    notes.push(surfacePhrase(surface, 'sameFamily'))
  }

  if (accentCount === 1) {
    notes.push(surfacePhrase(surface, 'singleAccent'))
  } else if (accentCount > 1) {
    notes.push(surfacePhrase(surface, 'multipleAccent'))
  }

  return notes.slice(0, 4)
}

export function buildMissingSlotCopy(slot: RecommendationMissingSlot, surface: RecommendationCopySurface = 'default') {
  const copy: Record<RecommendationMissingSlot, Record<RecommendationCopySurface, string>> = {
    shoes: {
      today: '未录入鞋履，今天穿搭仍可生成，但收尾完整度会降低。',
      shop: '衣橱里缺少能给核心搭配收尾的鞋履，购买鞋履时要看它能补几套完整度。',
      inspiration: '缺少鞋履替代时，灵感仍可参考，但落地收尾需要另找一双鞋。',
      travel: '当前衣橱里没有可打包鞋履，计划仍能生成，但出行前需要补一双能覆盖主要行程的鞋。',
      default: '缺少鞋履会影响整套收尾完整度，但不阻断推荐。'
    },
    bag: {
      today: '未录入包袋，今天穿搭仍可生成，但场景完整度会降低。',
      shop: '衣橱里缺少能补场景完整度的包袋，购买包袋时要看它能否承接通勤、出行或随身物品。',
      inspiration: '缺少包袋替代时，灵感仍可参考，但场景完整度需要后续补齐。',
      travel: '当前衣橱里没有可打包包袋，计划仍能生成，但随身物品和场景完整度需要额外处理。',
      default: '缺少包袋会影响场景完整度，但不阻断推荐。'
    },
    accessories: {
      today: '未录入配饰，今天穿搭仍可生成，但精致度和视觉中心强化会降低。',
      shop: '衣橱里缺少能强化视觉中心的配饰，购买配饰时要看它是否真的补风格记忆点。',
      inspiration: '缺少配饰替代时，灵感仍可参考，但精致度和视觉中心会弱一些。',
      travel: '当前不强制打包配饰，缺少配饰只会影响精致度和视觉中心强化。',
      default: '缺少配饰会影响精致度和视觉中心强化，但不阻断推荐。'
    },
    outerLayer: {
      today: '当前缺少外层，今天穿搭仍可生成，但冷天保暖和层次完整度会降低。',
      shop: '衣橱里缺少外层时，购买外层要优先看它能否补温差和层次。',
      inspiration: '缺少外层替代时，灵感仍可参考，但叠穿公式会弱一些。',
      travel: '这趟更适合带一件外层，但当前衣橱里没有可直接打包的外层，冷天或长途温差会更难处理。',
      default: '缺少外层会影响保暖和层次完整度，但不阻断推荐。'
    }
  }

  return copy[slot][surface] ?? copy[slot].default
}

export function buildInspirationAttemptLabel() {
  return '灵感尝试'
}
