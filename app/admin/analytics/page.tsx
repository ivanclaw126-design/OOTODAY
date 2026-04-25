import { notFound, redirect } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'
import { getAnalyticsDashboardData, normalizeAnalyticsRange } from '@/lib/analytics/admin'
import { getSession } from '@/lib/auth/get-session'

function getAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

export default async function AdminAnalyticsPage({
  searchParams
}: {
  searchParams?: Promise<{ range?: string }>
}) {
  const session = await getSession()

  if (!session) {
    redirect('/')
  }

  const email = session.user.email?.trim().toLowerCase() ?? ''

  if (!getAdminEmails().has(email)) {
    notFound()
  }

  const params = (await searchParams) ?? {}
  const range = normalizeAnalyticsRange(params.range)
  const data = await getAnalyticsDashboardData(range)

  return <AnalyticsDashboard data={data} />
}
