import { describe, expect, it } from 'vitest'
import { buildAnalyticsDashboardData } from '@/lib/analytics/admin'
import type { AnalyticsEventRow, AnalyticsFeedbackRow, AnalyticsProfileRow } from '@/lib/analytics/admin'

function event(overrides: Partial<AnalyticsEventRow>): AnalyticsEventRow {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    user_id: overrides.user_id ?? 'user-1',
    anonymous_id: null,
    session_id: null,
    event_name: overrides.event_name ?? 'page_viewed',
    module: overrides.module ?? 'today',
    route: overrides.route ?? '/today',
    properties: overrides.properties ?? {},
    created_at: overrides.created_at ?? '2026-04-25T10:00:00.000Z'
  }
}

function feedback(overrides: Partial<AnalyticsFeedbackRow>): AnalyticsFeedbackRow {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    user_id: overrides.user_id ?? 'user-1',
    context: overrides.context ?? 'today',
    rating: overrides.rating ?? 5,
    reason_tags: overrides.reason_tags ?? [],
    created_at: overrides.created_at ?? '2026-04-25T10:00:00.000Z'
  }
}

describe('analytics dashboard aggregation', () => {
  it('builds overview, feature usage, funnels, friction, and recommendation quality', () => {
    const events = [
      event({ event_name: 'page_viewed', module: 'today', user_id: 'user-1' }),
      event({ event_name: 'closet_viewed', module: 'closet', route: '/closet', user_id: 'user-1' }),
      event({ event_name: 'closet_item_created', module: 'closet', route: '/closet', user_id: 'user-1' }),
      event({ event_name: 'today_viewed', module: 'today', user_id: 'user-1' }),
      event({ event_name: 'today_recommendation_generated', module: 'today', user_id: 'user-1' }),
      event({ event_name: 'today_recommendation_refreshed', module: 'today', user_id: 'user-1' }),
      event({ event_name: 'today_recommendation_refreshed', module: 'today', user_id: 'user-1' }),
      event({ event_name: 'today_recommendation_refreshed', module: 'today', user_id: 'user-1' }),
      event({ event_name: 'today_ootd_submitted', module: 'today', user_id: 'user-1' }),
      event({ event_name: 'shop_candidate_analyze_failed', module: 'shop', route: '/shop', user_id: 'user-2' }),
      event({ event_name: 'server_action_failed', module: 'system', route: '/shop', user_id: 'user-2' })
    ]
    const feedbackEvents = [
      feedback({ rating: 5, reason_tags: ['like_color'] }),
      feedback({ rating: 2, reason_tags: ['dislike_comfort', 'dislike_color'] })
    ]
    const profiles: AnalyticsProfileRow[] = [
      { id: 'user-1', created_at: '2026-04-24T10:00:00.000Z' },
      { id: 'user-2', created_at: '2026-04-25T09:00:00.000Z' }
    ]

    const data = buildAnalyticsDashboardData({
      range: '7d',
      events,
      feedbackEvents,
      profiles,
      now: new Date('2026-04-25T12:00:00.000Z')
    })

    expect(data.overview).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'DAU', value: '2' }),
      expect.objectContaining({ label: '新注册用户', value: '2' }),
      expect.objectContaining({ label: 'Today 推荐', value: '1' }),
      expect.objectContaining({ label: '平均推荐评分', value: '3.5' })
    ]))
    expect(data.featureUsage[0]).toEqual(expect.objectContaining({
      module: 'today',
      activeUsers: 1,
      eventCount: 7
    }))
    expect(data.funnels.find((funnel) => funnel.title === '新用户激活漏斗')?.steps.at(-1)).toEqual(
      expect.objectContaining({ label: '提交 OOTD 评分', value: 1 })
    )
    expect(data.friction).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Shop 分析失败', value: 1 }),
      expect.objectContaining({ label: '高刷新用户', value: 1 }),
      expect.objectContaining({ label: '低分推荐', value: 1 })
    ]))
    expect(data.recommendationQuality.lowRatingReasonTags).toEqual([
      { tag: 'dislike_comfort', count: 1 },
      { tag: 'dislike_color', count: 1 }
    ])
  })
})
