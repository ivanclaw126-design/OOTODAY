export type RecommendationTrendSource = 'editorial' | 'manual' | 'import'

export type RecommendationTrendStatus = 'active' | 'paused' | 'expired'

export type RecommendationTrendSignal = {
  tag: string
  source: RecommendationTrendSource
  aliases: string[]
  activeWeight: number
  applicableScenes: string[]
  applicableStyles: string[]
}

export type RecommendationTrendRow = {
  tag: string
  source?: RecommendationTrendSource | string | null
  aliases?: string[] | null
  start_date?: string | null
  end_date?: string | null
  weight?: number | string | null
  decay_rate?: number | string | null
  applicable_scenes?: string[] | null
  applicable_styles?: string[] | null
  status?: RecommendationTrendStatus | string | null
}

export const DEFAULT_RECOMMENDATION_TRENDS: RecommendationTrendSignal[] = [
  { tag: 'brooch', source: 'editorial', aliases: ['胸针'], activeWeight: 0.9, applicableScenes: ['work', 'date', 'party'], applicableStyles: ['classic', '复古'] },
  { tag: 'lace', source: 'editorial', aliases: ['蕾丝'], activeWeight: 0.85, applicableScenes: ['date', 'party'], applicableStyles: ['浪漫', '甜美'] },
  { tag: 'cool blue', source: 'editorial', aliases: ['蓝色', '浅蓝色', '冰蓝'], activeWeight: 0.8, applicableScenes: ['work', 'casual', 'travel'], applicableStyles: ['清爽', '极简'] },
  { tag: 'khaki', source: 'editorial', aliases: ['卡其', '卡其色'], activeWeight: 0.78, applicableScenes: ['work', 'casual', 'travel'], applicableStyles: ['通勤', '户外'] },
  { tag: 'poetcore', source: 'editorial', aliases: ['诗人风', '浪漫复古'], activeWeight: 0.72, applicableScenes: ['date', 'casual'], applicableStyles: ['浪漫', '复古'] },
  { tag: 'glamoratti', source: 'editorial', aliases: ['华丽', '派对感'], activeWeight: 0.7, applicableScenes: ['party', 'date'], applicableStyles: ['华丽'] },
  { tag: 'structured shoulder', source: 'editorial', aliases: ['垫肩', '廓形肩'], activeWeight: 0.82, applicableScenes: ['work', 'party'], applicableStyles: ['通勤', '强气场'] },
  { tag: 'funnel neck', source: 'editorial', aliases: ['高领', '漏斗领'], activeWeight: 0.74, applicableScenes: ['work', 'casual'], applicableStyles: ['极简', '通勤'] },
  { tag: 'celestial', source: 'editorial', aliases: ['星月', '星星', '月亮'], activeWeight: 0.68, applicableScenes: ['party', 'date'], applicableStyles: ['浪漫', '配饰重点'] }
]

function toNumber(value: number | string | null | undefined, fallback: number) {
  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function daysBetween(startDate: string | null | undefined, now: Date) {
  if (!startDate) {
    return 0
  }

  const start = new Date(startDate)
  if (Number.isNaN(start.getTime())) {
    return 0
  }

  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)))
}

function isSupportedSource(source: string | null | undefined): source is RecommendationTrendSource {
  return source === 'editorial' || source === 'manual' || source === 'import'
}

export function normalizeRecommendationTrendRows(
  rows: RecommendationTrendRow[] | null | undefined,
  now = new Date()
): RecommendationTrendSignal[] {
  const signals = (rows ?? [])
    .filter((row) => row.status === 'active')
    .filter((row) => {
      if (!row.end_date) {
        return true
      }

      const end = new Date(row.end_date)
      return Number.isNaN(end.getTime()) || end >= now
    })
    .map((row) => {
      const source = isSupportedSource(row.source) ? row.source : 'editorial'
      const weight = toNumber(row.weight, 1)
      const decayRate = toNumber(row.decay_rate, 0.02)
      const ageDays = daysBetween(row.start_date, now)
      const activeWeight = clamp(weight * Math.exp(-decayRate * ageDays), 0, 3)

      return {
        tag: row.tag,
        source,
        aliases: row.aliases ?? [],
        activeWeight,
        applicableScenes: row.applicable_scenes ?? [],
        applicableStyles: row.applicable_styles ?? []
      }
    })
    .filter((signal) => signal.tag.trim() && signal.activeWeight > 0)

  return signals.length > 0 ? signals : DEFAULT_RECOMMENDATION_TRENDS
}

export function getTrendSearchTags(signals: RecommendationTrendSignal[] | null | undefined) {
  return (signals && signals.length > 0 ? signals : DEFAULT_RECOMMENDATION_TRENDS)
    .flatMap((signal) => [signal.tag, ...signal.aliases])
    .filter((tag, index, tags) => tag.trim() && tags.indexOf(tag) === index)
}
