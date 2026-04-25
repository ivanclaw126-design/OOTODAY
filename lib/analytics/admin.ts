import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

export type AnalyticsDashboardRange = '7d' | '30d' | 'all'

export type AnalyticsEventRow = Pick<
  Database['public']['Tables']['analytics_events']['Row'],
  'id' | 'user_id' | 'anonymous_id' | 'session_id' | 'event_name' | 'module' | 'route' | 'properties' | 'created_at'
>

export type AnalyticsFeedbackRow = Pick<
  Database['public']['Tables']['outfit_feedback_events']['Row'],
  'id' | 'user_id' | 'context' | 'rating' | 'reason_tags' | 'created_at'
>

export type AnalyticsProfileRow = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'created_at'
>

export type OverviewMetric = {
  label: string
  value: string
  hint?: string
}

export type FeatureUsageRow = {
  module: string
  activeUsers: number
  eventCount: number
  eventsPerUser: number
  topEvent: string
}

export type FunnelStep = {
  label: string
  value: number
  rate: number
}

export type FunnelCard = {
  title: string
  steps: FunnelStep[]
}

export type FrictionMetric = {
  label: string
  value: number
  hint: string
}

export type RecommendationQuality = {
  averageRating: number | null
  ratingDistribution: { rating: number; count: number }[]
  lowRatingReasonTags: { tag: string; count: number }[]
}

export type AnalyticsDashboardData = {
  range: AnalyticsDashboardRange
  rangeLabel: string
  overview: OverviewMetric[]
  featureUsage: FeatureUsageRow[]
  funnels: FunnelCard[]
  friction: FrictionMetric[]
  recommendationQuality: RecommendationQuality
}

const rangeLabels: Record<AnalyticsDashboardRange, string> = {
  '7d': '最近 7 天',
  '30d': '最近 30 天',
  all: '全部'
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function actorId(event: AnalyticsEventRow) {
  return event.user_id ?? event.anonymous_id ?? event.session_id ?? null
}

function uniqueActorCount(events: AnalyticsEventRow[]) {
  return new Set(events.map(actorId).filter((value): value is string => Boolean(value))).size
}

function countEvents(events: AnalyticsEventRow[], eventName: string) {
  return events.filter((event) => event.event_name === eventName).length
}

function countEventsByNames(events: AnalyticsEventRow[], eventNames: string[]) {
  const names = new Set(eventNames)
  return events.filter((event) => names.has(event.event_name)).length
}

function uniqueActorsForEvents(events: AnalyticsEventRow[], eventNames: string[]) {
  const names = new Set(eventNames)
  return new Set(
    events
      .filter((event) => names.has(event.event_name))
      .map(actorId)
      .filter((value): value is string => Boolean(value))
  ).size
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function formatDecimal(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) {
    return '-'
  }

  return value.toFixed(digits)
}

function topEntry(counts: Map<string, number>) {
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0] ?? null
}

export function normalizeAnalyticsRange(value: string | null | undefined): AnalyticsDashboardRange {
  return value === '30d' || value === 'all' ? value : '7d'
}

export function getAnalyticsRangeStart(range: AnalyticsDashboardRange, now = new Date()) {
  if (range === '7d') {
    return addDays(now, -7)
  }

  if (range === '30d') {
    return addDays(now, -30)
  }

  return null
}

function buildFeatureUsage(events: AnalyticsEventRow[]): FeatureUsageRow[] {
  const modules = new Map<string, AnalyticsEventRow[]>()

  events.forEach((event) => {
    if (event.module === 'system') {
      return
    }

    modules.set(event.module, [...(modules.get(event.module) ?? []), event])
  })

  return [...modules.entries()]
    .map(([module, moduleEvents]) => {
      const eventCounts = new Map<string, number>()

      moduleEvents.forEach((event) => {
        eventCounts.set(event.event_name, (eventCounts.get(event.event_name) ?? 0) + 1)
      })

      const activeUsers = uniqueActorCount(moduleEvents)
      const top = topEntry(eventCounts)

      return {
        module,
        activeUsers,
        eventCount: moduleEvents.length,
        eventsPerUser: activeUsers === 0 ? 0 : moduleEvents.length / activeUsers,
        topEvent: top ? `${top[0]} (${top[1]})` : '-'
      }
    })
    .sort((left, right) => right.eventCount - left.eventCount)
}

function buildFunnels(events: AnalyticsEventRow[]): FunnelCard[] {
  const definitions = [
    {
      title: '新用户激活漏斗',
      steps: [
        ['进入应用', ['page_viewed']],
        ['进入 Closet', ['closet_viewed']],
        ['添加第一件衣服', ['closet_item_created']],
        ['进入 Today', ['today_viewed']],
        ['生成推荐', ['today_recommendation_generated']],
        ['提交 OOTD 评分', ['today_ootd_submitted']]
      ]
    },
    {
      title: 'Today 推荐漏斗',
      steps: [
        ['进入 Today', ['today_viewed']],
        ['看到推荐', ['today_recommendation_generated']],
        ['刷新推荐', ['today_recommendation_refreshed']],
        ['提交评分', ['today_ootd_submitted']]
      ]
    },
    {
      title: 'Travel 使用漏斗',
      steps: [
        ['进入 Travel', ['travel_viewed']],
        ['生成计划', ['travel_plan_generated']],
        ['保存计划', ['travel_plan_saved']]
      ]
    },
    {
      title: 'Shop 分析漏斗',
      steps: [
        ['进入 Shop', ['shop_viewed']],
        ['提交链接/图片', ['shop_candidate_url_submitted']],
        ['开始分析', ['shop_candidate_analyze_started']],
        ['分析成功', ['shop_candidate_analyze_succeeded']]
      ]
    }
  ] as const

  return definitions.map((definition) => {
    const values = definition.steps.map(([label, eventNames]) => ({
      label,
      value: uniqueActorsForEvents(events, [...eventNames])
    }))
    const firstValue = values[0]?.value ?? 0

    return {
      title: definition.title,
      steps: values.map((step) => ({
        ...step,
        rate: firstValue === 0 ? 0 : step.value / firstValue
      }))
    }
  })
}

function buildFriction(events: AnalyticsEventRow[], feedbackEvents: AnalyticsFeedbackRow[]): FrictionMetric[] {
  const refreshCounts = new Map<string, number>()

  events
    .filter((event) => event.event_name === 'today_recommendation_refreshed')
    .forEach((event) => {
      const id = actorId(event)

      if (id) {
        refreshCounts.set(id, (refreshCounts.get(id) ?? 0) + 1)
      }
    })

  return [
    {
      label: '空衣橱阻塞',
      value: countEventsByNames(events, [
        'closet_empty_state_viewed',
        'today_empty_closet_blocked',
        'travel_empty_closet_blocked'
      ]),
      hint: '用户进入核心功能但衣橱还没有可用单品'
    },
    {
      label: 'Shop 分析失败',
      value: countEvents(events, 'shop_candidate_analyze_failed'),
      hint: '链接解析、品类拦截或商品图识别失败'
    },
    {
      label: 'Server action 失败',
      value: countEvents(events, 'server_action_failed'),
      hint: '已有 beta issue reporting 上报的可恢复失败'
    },
    {
      label: '高刷新用户',
      value: [...refreshCounts.values()].filter((count) => count >= 3).length,
      hint: '同一用户在时间窗内刷新 Today 推荐 3 次或更多'
    },
    {
      label: '低分推荐',
      value: feedbackEvents.filter((event) => event.rating <= 2).length,
      hint: 'OOTD 评分低于等于 2 分的推荐反馈'
    }
  ]
}

function buildRecommendationQuality(feedbackEvents: AnalyticsFeedbackRow[]): RecommendationQuality {
  const distribution = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: feedbackEvents.filter((event) => event.rating === rating).length
  }))
  const reasonCounts = new Map<string, number>()
  const lowRatings = feedbackEvents.filter((event) => event.rating <= 2)

  lowRatings.forEach((event) => {
    event.reason_tags.forEach((tag) => {
      reasonCounts.set(tag, (reasonCounts.get(tag) ?? 0) + 1)
    })
  })

  const averageRating =
    feedbackEvents.length === 0
      ? null
      : feedbackEvents.reduce((total, event) => total + event.rating, 0) / feedbackEvents.length

  return {
    averageRating,
    ratingDistribution: distribution,
    lowRatingReasonTags: [...reasonCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))
  }
}

export function buildAnalyticsDashboardData({
  range,
  events,
  feedbackEvents,
  profiles,
  now = new Date()
}: {
  range: AnalyticsDashboardRange
  events: AnalyticsEventRow[]
  feedbackEvents: AnalyticsFeedbackRow[]
  profiles: AnalyticsProfileRow[]
  now?: Date
}): AnalyticsDashboardData {
  const oneDayStart = addDays(now, -1)
  const sevenDayStart = addDays(now, -7)
  const averageRating = buildRecommendationQuality(feedbackEvents).averageRating
  const dau = uniqueActorCount(events.filter((event) => new Date(event.created_at) >= oneDayStart))
  const wau = uniqueActorCount(events.filter((event) => new Date(event.created_at) >= sevenDayStart))
  const recommendationQuality = buildRecommendationQuality(feedbackEvents)

  return {
    range,
    rangeLabel: rangeLabels[range],
    overview: [
      { label: 'DAU', value: formatNumber(dau), hint: '最近 24 小时活跃用户' },
      { label: 'WAU', value: formatNumber(wau), hint: '最近 7 天活跃用户' },
      { label: '新注册用户', value: formatNumber(profiles.length), hint: rangeLabels[range] },
      { label: '事件总数', value: formatNumber(events.length), hint: rangeLabels[range] },
      { label: 'Today 推荐', value: formatNumber(countEvents(events, 'today_recommendation_generated')) },
      { label: 'OOTD 提交', value: formatNumber(countEvents(events, 'today_ootd_submitted')) },
      { label: 'Travel 生成', value: formatNumber(countEvents(events, 'travel_plan_generated')) },
      { label: 'Shop 成功/失败', value: `${countEvents(events, 'shop_candidate_analyze_succeeded')} / ${countEvents(events, 'shop_candidate_analyze_failed')}` },
      { label: '平均推荐评分', value: formatDecimal(averageRating), hint: '来自 outfit_feedback_events' },
      { label: '错误事件', value: formatNumber(countEventsByNames(events, ['error_shown', 'server_action_failed'])) }
    ],
    featureUsage: buildFeatureUsage(events),
    funnels: buildFunnels(events),
    friction: buildFriction(events, feedbackEvents),
    recommendationQuality
  }
}

export async function getAnalyticsDashboardData(range: AnalyticsDashboardRange) {
  const rangeStart = getAnalyticsRangeStart(range)
  const admin = createSupabaseAdminClient()
  let eventsQuery = admin
    .from('analytics_events')
    .select('id, user_id, anonymous_id, session_id, event_name, module, route, properties, created_at')
    .order('created_at', { ascending: false })
    .limit(5000)
  let feedbackQuery = admin
    .from('outfit_feedback_events')
    .select('id, user_id, context, rating, reason_tags, created_at')
    .order('created_at', { ascending: false })
    .limit(5000)
  let profilesQuery = admin
    .from('profiles')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (rangeStart) {
    const start = rangeStart.toISOString()
    eventsQuery = eventsQuery.gte('created_at', start)
    feedbackQuery = feedbackQuery.gte('created_at', start)
    profilesQuery = profilesQuery.gte('created_at', start)
  }

  const [eventsResult, feedbackResult, profilesResult] = await Promise.all([
    eventsQuery,
    feedbackQuery,
    profilesQuery
  ])

  if (eventsResult.error) {
    throw eventsResult.error
  }

  if (feedbackResult.error) {
    throw feedbackResult.error
  }

  if (profilesResult.error) {
    throw profilesResult.error
  }

  return buildAnalyticsDashboardData({
    range,
    events: (eventsResult.data ?? []) as AnalyticsEventRow[],
    feedbackEvents: (feedbackResult.data ?? []) as AnalyticsFeedbackRow[],
    profiles: (profilesResult.data ?? []) as AnalyticsProfileRow[]
  })
}
