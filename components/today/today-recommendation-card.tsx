'use client'

import { useState } from 'react'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { TodayOotdStatus, TodayRecommendation } from '@/lib/today/types'

function itemLabel(label: string, value: string | null) {
  return value ? `${label}：${value}` : `${label}：待补充`
}

export function TodayRecommendationCard({
  recommendation,
  ootdStatus,
  submitOotd
}: {
  recommendation: TodayRecommendation
  ootdStatus: TodayOotdStatus
  submitOotd: (input: {
    recommendation: TodayRecommendation
    satisfactionScore: number
  }) => Promise<{ error: string | null; wornAt: string | null }>
}) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRecorded = ootdStatus.status === 'recorded'

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

        {isRecorded ? (
          <p className="text-sm font-medium text-[var(--color-primary)]">今日已记录</p>
        ) : isConfirming ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <SecondaryButton
                  key={score}
                  type="button"
                  aria-pressed={selectedScore === score}
                  onClick={() => setSelectedScore(score)}
                >
                  {score} 分
                </SecondaryButton>
              ))}
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <div className="flex gap-2">
              <PrimaryButton
                type="button"
                disabled={isSubmitting || selectedScore === null}
                onClick={async () => {
                  setIsSubmitting(true)
                  setError(null)
                  const result = await submitOotd({
                    recommendation,
                    satisfactionScore: selectedScore ?? 0
                  })
                  setIsSubmitting(false)

                  if (result.error) {
                    setError(result.error)
                    return
                  }

                  setIsConfirming(false)
                }}
              >
                提交今日记录
              </PrimaryButton>
              <SecondaryButton
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setIsConfirming(false)
                  setSelectedScore(null)
                  setError(null)
                }}
              >
                取消
              </SecondaryButton>
            </div>
          </div>
        ) : (
          <PrimaryButton
            type="button"
            onClick={() => {
              setIsConfirming(true)
              setSelectedScore(null)
              setError(null)
            }}
          >
            记为今日已穿
          </PrimaryButton>
        )}
      </div>
    </Card>
  )
}
