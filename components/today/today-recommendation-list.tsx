import { EmptyState } from '@/components/ui/empty-state'
import { TodayRecommendationCard } from '@/components/today/today-recommendation-card'
import type { TodayRecommendation } from '@/lib/today/types'

export function TodayRecommendationList({
  recommendations,
  recommendationError
}: {
  recommendations: TodayRecommendation[]
  recommendationError: boolean
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
    <div className="grid gap-4">
      {recommendations.map((recommendation) => (
        <TodayRecommendationCard key={recommendation.id} recommendation={recommendation} />
      ))}
    </div>
  )
}
