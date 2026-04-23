import { EmptyState } from '@/components/ui/empty-state'
import { TodayRecommendationCard } from '@/components/today/today-recommendation-card'
import type { TodayOotdStatus, TodayRecommendation } from '@/lib/today/types'

export function TodayRecommendationList({
  recommendations,
  recommendationError,
  ootdStatus,
  submitOotd
}: {
  recommendations: TodayRecommendation[]
  recommendationError: boolean
  ootdStatus: TodayOotdStatus
  submitOotd: (input: {
    recommendation: TodayRecommendation
    satisfactionScore: number
  }) => Promise<{ error: string | null; wornAt: string | null }>
}) {
  if (recommendationError) {
    return (
      <EmptyState
        title="推荐暂时生成失败"
        description="刷新页面后重试，或先去衣橱检查单品信息是否完整。"
      />
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-neutral-dark)]">今日推荐</p>
          <p className="text-2xl font-semibold tracking-[-0.05em] text-[var(--color-primary)]">3 套可直接做决定的搭配</p>
        </div>
        <p className="text-sm text-[var(--color-neutral-dark)]">按今天的场景、天气和最近穿着整理</p>
      </div>

      <div className="grid gap-3">
        {recommendations.map((recommendation, index) => (
          <TodayRecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            index={index + 1}
            ootdStatus={ootdStatus}
            submitOotd={submitOotd}
          />
        ))}
      </div>
    </section>
  )
}
