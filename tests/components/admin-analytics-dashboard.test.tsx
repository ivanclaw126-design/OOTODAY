import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'
import type { AnalyticsDashboardData } from '@/lib/analytics/admin'

const data: AnalyticsDashboardData = {
  range: '7d',
  rangeLabel: '最近 7 天',
  overview: [
    { label: 'DAU', value: '2', hint: '最近 24 小时活跃用户' },
    { label: 'Today 推荐', value: '4' }
  ],
  activeUserTrend: [
    { date: '2026-04-23', label: '4/23', dau: 1, wau: 1 },
    { date: '2026-04-24', label: '4/24', dau: 2, wau: 2 },
    { date: '2026-04-25', label: '4/25', dau: 1, wau: 2 }
  ],
  featureUsage: [
    {
      module: 'today',
      moduleLabel: 'Today',
      activeUsers: 2,
      eventCount: 8,
      eventsPerUser: 4,
      topEvent: 'today_viewed (2)'
    },
    {
      module: 'inspiration',
      moduleLabel: 'Looks',
      activeUsers: 1,
      eventCount: 3,
      eventsPerUser: 3,
      topEvent: 'inspiration_viewed (1)'
    }
  ],
  funnels: [
    {
      title: 'Today 推荐漏斗',
      steps: [
        { label: '进入 Today', value: 2, rate: 1 },
        { label: '提交评分', value: 1, rate: 0.5 }
      ]
    }
  ],
  friction: [
    {
      label: '空衣橱阻塞',
      value: 3,
      hint: '用户进入核心功能但衣橱还没有可用单品'
    }
  ],
  recommendationQuality: {
    averageRating: 4.5,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 1 },
      { rating: 3, count: 0 },
      { rating: 4, count: 1 },
      { rating: 5, count: 2 }
    ],
    lowRatingReasonTags: [{ tag: 'dislike_comfort', count: 1 }]
  }
}

describe('AnalyticsDashboard', () => {
  it('renders overview, feature usage, funnels, friction, and recommendation quality', () => {
    render(<AnalyticsDashboard data={data} />)

    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument()
    expect(screen.getAllByText('DAU')).toHaveLength(2)
    expect(screen.getByText('Today 推荐')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'DAU / WAU 历史趋势' })).toBeInTheDocument()
    expect(screen.getByText('4/25')).toBeInTheDocument()
    expect(screen.getByText('功能使用排行')).toBeInTheDocument()
    expect(screen.getByText('Looks')).toBeInTheDocument()
    expect(screen.getByText('today_viewed (2)')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Today 推荐漏斗' })).toBeInTheDocument()
    expect(screen.getByText('空衣橱阻塞')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '推荐质量' })).toBeInTheDocument()
    expect(screen.getByText('dislike_comfort · 1')).toBeInTheDocument()

    const rangeNav = screen.getByRole('navigation', { name: 'Analytics date range' })
    expect(within(rangeNav).getByRole('link', { name: '最近 7 天' })).toHaveAttribute(
      'href',
      '/admin/analytics?range=7d'
    )
  })
})
