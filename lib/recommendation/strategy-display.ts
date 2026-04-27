import {
  RECOMMENDATION_STRATEGY_KEYS,
  type RecommendationStrategyKey,
  type RecommendationScoreBreakdown,
  type RecommendationStrategyScores
} from '@/lib/recommendation/canonical-types'

export const STRATEGY_SUPPORTING_THRESHOLD = 72
export const STRATEGY_WEAK_THRESHOLD = 60

export type RecommendationStrategyVisualType =
  | 'capsule-grid'
  | 'formula-stack'
  | 'word-triad'
  | 'palette-line'
  | 'sandwich-band'
  | 'shoe-offset'
  | 'two-third-block'
  | 'proportion-bars'
  | 'layer-stack'
  | 'tonal-scale'
  | 'occasion-axis'
  | 'pinterest-frame'
  | 'trend-overlay'

export type RecommendationStrategyHitLevel = 'primary' | 'supporting' | 'neutral' | 'weak'

export type RecommendationStrategyDisplayCopy = {
  key: RecommendationStrategyKey
  name: string
  shortLabel: string
  meaning: string
  core: string
  visualType: RecommendationStrategyVisualType
}

export type RecommendationStrategyDisplayRow = RecommendationStrategyDisplayCopy & {
  score: number
  rank: number
  level: RecommendationStrategyHitLevel
}

const STRATEGY_DISPLAY_COPY = {
  capsuleWardrobe: {
    name: '胶囊衣橱',
    shortLabel: '胶囊',
    meaning: '看这套是否由基础色、可复用单品和稳定风格线组成。',
    core: '先用高复穿单品做底盘，再让一套衣服服务多个日常场景。',
    visualType: 'capsule-grid'
  },
  outfitFormula: {
    name: '穿搭公式',
    shortLabel: '公式',
    meaning: '看核心 slot 是否形成一套可反复套用的组合结构。',
    core: '把上装、下装、鞋履或一件式主件组合成低决策成本的固定公式。',
    visualType: 'formula-stack'
  },
  threeWordStyle: {
    name: '三词风格',
    shortLabel: '三词',
    meaning: '看这套和你的日常风格词、场景词是否有稳定交集。',
    core: '用 3 个稳定关键词约束整套气质，避免每件单品各说各话。',
    visualType: 'word-triad'
  },
  personalColorPalette: {
    name: '个人色彩',
    shortLabel: '色彩',
    meaning: '看颜色强度、重点色数量和你的配色偏好是否一致。',
    core: '控制基础色、辅助色和重点色的比例，让颜色为人服务。',
    visualType: 'palette-line'
  },
  sandwichDressing: {
    name: '三明治穿搭',
    shortLabel: '呼应',
    meaning: '看上半身和鞋包是否形成颜色或质感呼应。',
    core: '上下两端互相呼应，中间层负责打断，整体更完整。',
    visualType: 'sandwich-band'
  },
  wrongShoeTheory: {
    name: '错鞋理论',
    shortLabel: '错鞋',
    meaning: '看鞋履是否和主体产生可控错位，同时保留舒适与天气底线。',
    core: '用一双不完全同风格的鞋制造松弛感，但错位不能失控。',
    visualType: 'shoe-offset'
  },
  twoThirdRule: {
    name: '2/3 规则',
    shortLabel: '2/3',
    meaning: '看这套是否用两部分低压力单品搭配一部分精致锚点。',
    core: '三分之二保持好穿，三分之一负责提气，降低准备成本。',
    visualType: 'two-third-block'
  },
  proportionBalance: {
    name: '比例平衡',
    shortLabel: '比例',
    meaning: '看上下体量、腰线或一件式轮廓是否形成清楚比例。',
    core: '让轮廓有明确收束点，避免上下装体量互相抢夺。',
    visualType: 'proportion-bars'
  },
  layering: {
    name: '层次策略',
    shortLabel: '层次',
    meaning: '看叠穿是否服务温差、材质和轮廓，而不是无目的加层。',
    core: '每一层都有功能，内搭定形，外层控温，留出清晰边界。',
    visualType: 'layer-stack'
  },
  tonalDressing: {
    name: '同色系穿搭',
    shortLabel: '同色',
    meaning: '看颜色是否在同簇或相近色阶内形成明度层次。',
    core: '把颜色收进一个色系，用深浅、材质和面积制造变化。',
    visualType: 'tonal-scale'
  },
  occasionNiche: {
    name: '场景垂直',
    shortLabel: '场景',
    meaning: '看单品正式度、舒适度和风格标签是否承接今天场景。',
    core: '先满足今天要去哪里，再决定造型该收紧还是放松。',
    visualType: 'occasion-axis'
  },
  pinterestRecreation: {
    name: '灵感复刻',
    shortLabel: '复刻',
    meaning: '看这套能否保住灵感图的关键 slot、风格标签和公式感。',
    core: '不照搬单品，优先复刻颜色、轮廓和关键完成度结构。',
    visualType: 'pinterest-frame'
  },
  trendOverlay: {
    name: '趋势覆盖',
    shortLabel: '趋势',
    meaning: '看是否轻量命中趋势标签，并且没有盖过日常可穿性。',
    core: '趋势只做低权重加分，先保证能穿，再增加一点当下感。',
    visualType: 'trend-overlay'
  }
} satisfies Record<RecommendationStrategyKey, Omit<RecommendationStrategyDisplayCopy, 'key'>>

function clampDisplayScore(score: number | null | undefined) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

function getHitLevel(score: number, index: number, key: RecommendationStrategyKey, primaryStrategy: RecommendationStrategyKey | null) {
  if (key === primaryStrategy || (!primaryStrategy && index === 0)) {
    return 'primary'
  }

  if (score >= STRATEGY_SUPPORTING_THRESHOLD) {
    return 'supporting'
  }

  if (score < STRATEGY_WEAK_THRESHOLD) {
    return 'weak'
  }

  return 'neutral'
}

export function getRecommendationStrategyDisplay(key: RecommendationStrategyKey): RecommendationStrategyDisplayCopy {
  return {
    key,
    ...STRATEGY_DISPLAY_COPY[key]
  }
}

export function getRecommendationStrategyDisplayList(): RecommendationStrategyDisplayCopy[] {
  return RECOMMENDATION_STRATEGY_KEYS.map(getRecommendationStrategyDisplay)
}

export function buildRecommendationStrategyRows(
  strategyScores: Partial<RecommendationStrategyScores> | null | undefined,
  options: {
    primaryStrategy?: RecommendationStrategyKey | null
  } = {}
): RecommendationStrategyDisplayRow[] {
  if (!strategyScores) {
    return []
  }

  const primaryStrategy = options.primaryStrategy ?? null

  return RECOMMENDATION_STRATEGY_KEYS
    .map((key) => ({
      ...getRecommendationStrategyDisplay(key),
      score: clampDisplayScore(strategyScores[key])
    }))
    .sort((left, right) => {
      if (left.key === primaryStrategy && right.key !== primaryStrategy) {
        return -1
      }

      if (right.key === primaryStrategy && left.key !== primaryStrategy) {
        return 1
      }

      if (right.score !== left.score) {
        return right.score - left.score
      }

      return RECOMMENDATION_STRATEGY_KEYS.indexOf(left.key) - RECOMMENDATION_STRATEGY_KEYS.indexOf(right.key)
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      level: getHitLevel(row.score, index, row.key, primaryStrategy)
    }))
}

export function buildRecommendationStrategySummaryRows(
  scoreBreakdown: Pick<RecommendationScoreBreakdown, 'strategyScores' | 'primaryStrategy' | 'strategySummaryKeys'> | null | undefined
): RecommendationStrategyDisplayRow[] {
  if (!scoreBreakdown?.strategyScores) {
    return []
  }

  const rows = buildRecommendationStrategyRows(scoreBreakdown.strategyScores, {
    primaryStrategy: scoreBreakdown.primaryStrategy ?? null
  })
  const summaryKeys = scoreBreakdown.strategySummaryKeys?.filter((key, index, keys) => keys.indexOf(key) === index) ?? []

  if (summaryKeys.length === 0) {
    return rows.slice(0, 3)
  }

  const keyedRows = new Map(rows.map((row) => [row.key, row]))
  const summaryRows = summaryKeys
    .map((key) => keyedRows.get(key))
    .filter((row): row is RecommendationStrategyDisplayRow => Boolean(row))

  for (const row of rows) {
    if (summaryRows.length >= 3) {
      break
    }

    if (!summaryRows.some((item) => item.key === row.key)) {
      summaryRows.push(row)
    }
  }

  return summaryRows.slice(0, 3)
}
