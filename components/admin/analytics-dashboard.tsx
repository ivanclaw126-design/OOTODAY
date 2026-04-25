import Link from 'next/link'
import { Card } from '@/components/ui/card'
import type { AnalyticsDashboardData, AnalyticsDashboardRange } from '@/lib/analytics/admin'

const ranges: { value: AnalyticsDashboardRange; label: string }[] = [
  { value: '7d', label: '最近 7 天' },
  { value: '30d', label: '最近 30 天' },
  { value: 'all', label: '全部' }
]

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

export function AnalyticsDashboard({ data }: { data: AnalyticsDashboardData }) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f0e7_0%,#f7f3eb_45%,#efe8dd_100%)] px-4 py-6 text-[var(--color-primary)] sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-neutral-dark)]">Admin</p>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Analytics</h1>
            <p className="max-w-2xl text-sm leading-6 text-[var(--color-neutral-dark)]">
              围绕 Closet 到 Today 的真实闭环看激活、功能使用、卡点和推荐质量。
            </p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Analytics date range">
            {ranges.map((range) => (
              <Link
                key={range.value}
                href={`/admin/analytics?range=${range.value}`}
                className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                  data.range === range.value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                    : 'border-[var(--color-line)] bg-white/78 text-[var(--color-primary)]'
                }`}
              >
                {range.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Overview">
          {data.overview.map((metric) => (
            <Card key={metric.label} className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">{metric.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-[var(--color-primary)]">{metric.value}</p>
              {metric.hint ? <p className="mt-1 text-xs text-[var(--color-neutral-dark)]">{metric.hint}</p> : null}
            </Card>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-neutral-dark)]">Feature Usage</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">功能使用排行</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.16em] text-[var(--color-neutral-dark)]">
                    <tr>
                      <th className="py-2 pr-3">Module</th>
                      <th className="py-2 pr-3">活跃用户</th>
                      <th className="py-2 pr-3">事件数</th>
                      <th className="py-2 pr-3">人均次数</th>
                      <th className="py-2 pr-3">Top event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.featureUsage.length === 0 ? (
                      <tr>
                        <td className="py-4 text-[var(--color-neutral-dark)]" colSpan={5}>
                          当前时间范围还没有功能事件。
                        </td>
                      </tr>
                    ) : (
                      data.featureUsage.map((row) => (
                        <tr key={row.module} className="border-t border-[var(--color-line)]">
                          <td className="py-3 pr-3 font-semibold">{row.module}</td>
                          <td className="py-3 pr-3">{row.activeUsers}</td>
                          <td className="py-3 pr-3">{row.eventCount}</td>
                          <td className="py-3 pr-3">{row.eventsPerUser.toFixed(1)}</td>
                          <td className="py-3 pr-3 text-[var(--color-neutral-dark)]">{row.topEvent}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-neutral-dark)]">Friction</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">卡点分析</h2>
              </div>
              <div className="grid gap-3">
                {data.friction.map((metric) => (
                  <div key={metric.label} className="rounded-[1.1rem] border border-[var(--color-line)] bg-white/72 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold">{metric.label}</p>
                      <p className="text-2xl font-semibold tracking-[-0.05em]">{metric.value}</p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-neutral-dark)]">{metric.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-2" aria-label="Funnels">
          {data.funnels.map((funnel) => (
            <Card key={funnel.title}>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-neutral-dark)]">Funnel</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">{funnel.title}</h2>
                </div>
                <div className="space-y-3">
                  {funnel.steps.map((step) => (
                    <div key={step.label} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{step.label}</span>
                        <span className="text-[var(--color-neutral-dark)]">
                          {step.value} · {formatPercent(step.rate)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-secondary)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-primary)]"
                          style={{ width: step.rate === 0 ? '0%' : `${Math.max(3, Math.round(step.rate * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </section>

        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-neutral-dark)]">Recommendation Quality</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">推荐质量</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[1.2rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-5 text-white">
                <p className="text-sm text-white/62">平均评分</p>
                <p className="mt-2 text-5xl font-semibold tracking-[-0.08em]">
                  {data.recommendationQuality.averageRating === null
                    ? '-'
                    : data.recommendationQuality.averageRating.toFixed(1)}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-5">
                {data.recommendationQuality.ratingDistribution.map((entry) => (
                  <div key={entry.rating} className="rounded-[1.1rem] border border-[var(--color-line)] bg-white/72 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">{entry.rating} 星</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.05em]">{entry.count}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">低分原因 Top 10</p>
              {data.recommendationQuality.lowRatingReasonTags.length === 0 ? (
                <p className="text-sm text-[var(--color-neutral-dark)]">当前没有低分原因标签。</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.recommendationQuality.lowRatingReasonTags.map((entry) => (
                    <span key={entry.tag} className="rounded-full border border-[var(--color-line)] bg-white/78 px-3 py-1.5 text-sm">
                      {entry.tag} · {entry.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
