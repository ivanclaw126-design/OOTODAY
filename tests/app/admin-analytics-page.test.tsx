import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()
const getAnalyticsDashboardData = vi.fn()
const redirect = vi.fn((path: string) => {
  throw new Error(`redirect:${path}`)
})
const notFound = vi.fn(() => {
  throw new Error('notFound')
})

vi.mock('@/lib/auth/get-session', () => ({
  getSession
}))

vi.mock('@/lib/analytics/admin', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/analytics/admin')>()

  return {
    ...original,
    getAnalyticsDashboardData
  }
})

vi.mock('next/navigation', () => ({
  redirect,
  notFound
}))

describe('AdminAnalyticsPage', () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = 'admin@example.com'
    getSession.mockReset()
    getAnalyticsDashboardData.mockReset()
    getAnalyticsDashboardData.mockResolvedValue({
      range: '7d',
      rangeLabel: '最近 7 天',
      overview: [],
      featureUsage: [],
      funnels: [],
      friction: [],
      recommendationQuality: {
        averageRating: null,
        ratingDistribution: [],
        lowRatingReasonTags: []
      }
    })
    redirect.mockClear()
    notFound.mockClear()
  })

  it('redirects signed-out users', async () => {
    getSession.mockResolvedValue(null)

    const AdminAnalyticsPage = (await import('@/app/admin/analytics/page')).default

    await expect(AdminAnalyticsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('redirect:/')
  })

  it('returns 404 for non-admin users', async () => {
    getSession.mockResolvedValue({ user: { id: 'user-1', email: 'user@example.com' } })

    const AdminAnalyticsPage = (await import('@/app/admin/analytics/page')).default

    await expect(AdminAnalyticsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('notFound')
  })

  it('loads dashboard data for admin users', async () => {
    getSession.mockResolvedValue({ user: { id: 'admin-1', email: 'admin@example.com' } })

    const AdminAnalyticsPage = (await import('@/app/admin/analytics/page')).default
    const result = await AdminAnalyticsPage({ searchParams: Promise.resolve({ range: '30d' }) })

    expect(getAnalyticsDashboardData).toHaveBeenCalledWith('30d')
    expect(result.type.name).toBe('AnalyticsDashboard')
  })
})
