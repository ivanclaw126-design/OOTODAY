import { EmptyState } from '@/components/ui/empty-state'
import { FeedbackLink } from '@/components/beta/feedback-link'
import { TodayRecommendationCard } from '@/components/today/today-recommendation-card'
import type { TodayOotdFeedbackInput, TodayOotdStatus, TodayRecommendation } from '@/lib/today/types'

export function TodayRecommendationList({
  recommendations,
  recommendationError,
  ootdStatus,
  recordedRecommendationId,
  submitOotd
}: {
  recommendations: TodayRecommendation[]
  recommendationError: boolean
  ootdStatus: TodayOotdStatus
  recordedRecommendationId: string | null
  submitOotd: (input: TodayOotdFeedbackInput) => Promise<{ error: string | null; wornAt: string | null }>
}) {
  if (recommendationError) {
    return (
      <EmptyState
        title="推荐暂时生成失败"
        description="刷新页面后重试，或先去衣橱检查单品信息是否完整。"
        action={
          <FeedbackLink
            surface="today_recommendation_error"
            label="反馈这个问题"
            className="mx-auto inline-flex rounded-full border border-[var(--color-line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-primary)]"
          />
        }
      />
    )
  }

  if (recommendations.length === 0) {
    return (
      <EmptyState
        title="暂时还凑不出 3 套推荐"
        description="先补齐上装、下装或连衣裙这类核心单品，再回来刷新推荐。"
      />
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-dark)]">今日推荐</p>
          <p className="text-[1.85rem] font-semibold tracking-[-0.05em] text-[var(--color-primary)] sm:text-2xl">3 套可直接做决定的搭配</p>
        </div>
        <p className="max-w-xs text-sm leading-6 text-[var(--color-neutral-dark)]">按今天的场景、天气和最近穿着整理</p>
      </div>

      <div className="grid gap-3">
        {recommendations.map((recommendation, index) => (
          <TodayRecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            index={index + 1}
            ootdStatus={ootdStatus}
            recordedRecommendationId={recordedRecommendationId}
            submitOotd={submitOotd}
          />
        ))}
      </div>
    </section>
  )
}
