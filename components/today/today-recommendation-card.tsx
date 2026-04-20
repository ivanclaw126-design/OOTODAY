import { Card } from '@/components/ui/card'
import type { TodayRecommendation } from '@/lib/today/types'

function itemLabel(label: string, value: string | null) {
  return value ? `${label}：${value}` : `${label}：待补充`
}

export function TodayRecommendationCard({ recommendation }: { recommendation: TodayRecommendation }) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[var(--color-neutral-dark)]">{recommendation.reason}</p>
        {recommendation.dress ? (
          <div className="flex flex-col gap-1 text-sm">
            <p>{itemLabel('主件', recommendation.dress.subCategory ?? recommendation.dress.category)}</p>
            <p>{itemLabel('颜色', recommendation.dress.colorCategory)}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 text-sm">
            <p>{itemLabel('上装', recommendation.top?.subCategory ?? recommendation.top?.category ?? null)}</p>
            <p>{itemLabel('下装', recommendation.bottom?.subCategory ?? recommendation.bottom?.category ?? null)}</p>
          </div>
        )}
        {recommendation.outerLayer ? (
          <p className="text-sm text-[var(--color-neutral-dark)]">
            外层建议：{recommendation.outerLayer.subCategory ?? recommendation.outerLayer.category}
          </p>
        ) : null}
      </div>
    </Card>
  )
}
