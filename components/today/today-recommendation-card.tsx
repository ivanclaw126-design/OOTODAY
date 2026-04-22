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
  index,
  ootdStatus,
  submitOotd
}: {
  recommendation: TodayRecommendation
  index: number
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
  const rankLabel = String(index).padStart(2, '0')

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-primary)]/15 bg-[var(--color-secondary)] text-sm font-semibold text-[var(--color-primary)]">
              {rankLabel}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">
                Outfit decision
              </p>
              <p className="text-lg font-semibold tracking-[-0.03em]">第 {index} 套</p>
            </div>
          </div>
          {isRecorded ? (
            <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
              已完成
            </span>
          ) : null}
        </div>

        <div className="rounded-[1.25rem] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(248,245,238,0.9)_100%)] p-4">
          <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">{recommendation.reason}</p>
        </div>

        {recommendation.dress ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-dark)]">
              <span className="rounded-full bg-[var(--color-secondary)] px-2.5 py-1 text-[var(--color-primary)]">
                一件式
              </span>
              <span>主件 / 颜色 / 风格</span>
            </div>
            <div className="rounded-[1.25rem] border border-black/5 bg-white/80 p-4">
              <p className="text-xl leading-tight font-semibold tracking-[-0.04em]">
                {recommendation.dress.subCategory ?? recommendation.dress.category}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-primary)]">
                <span className="rounded-full bg-[var(--color-secondary)] px-2.5 py-1">
                  {itemLabel('颜色', recommendation.dress.colorCategory)}
                </span>
                {recommendation.dress.styleTags.slice(0, 2).map((tag) => (
                  <span key={tag} className="rounded-full border border-black/5 bg-white px-2.5 py-1 text-[var(--color-neutral-dark)]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-dark)]">
              <span className="rounded-full bg-[var(--color-secondary)] px-2.5 py-1 text-[var(--color-primary)]">
                上下装
              </span>
              <span>上下装 / 外层</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-black/5 bg-white/80 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-dark)]">上装</p>
                <p className="mt-2 text-xl leading-tight font-semibold tracking-[-0.04em]">
                  {recommendation.top?.subCategory ?? recommendation.top?.category ?? '待补充上装'}
                </p>
                <p className="mt-2 text-sm text-[var(--color-neutral-dark)]">
                  {itemLabel('颜色', recommendation.top?.colorCategory ?? null)}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-black/5 bg-white/80 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-dark)]">下装</p>
                <p className="mt-2 text-xl leading-tight font-semibold tracking-[-0.04em]">
                  {recommendation.bottom?.subCategory ?? recommendation.bottom?.category ?? '待补充下装'}
                </p>
                <p className="mt-2 text-sm text-[var(--color-neutral-dark)]">
                  {itemLabel('颜色', recommendation.bottom?.colorCategory ?? null)}
                </p>
              </div>
            </div>
          </div>
        )}

        {recommendation.outerLayer ? (
          <div className="rounded-[1.25rem] border border-[var(--color-primary)]/10 bg-[var(--color-secondary)]/65 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-dark)]">外层建议</p>
            <p className="mt-2 text-base font-medium tracking-[-0.02em]">
              {recommendation.outerLayer.subCategory ?? recommendation.outerLayer.category}
            </p>
            <p className="mt-1 text-sm text-[var(--color-neutral-dark)]">
              {itemLabel('颜色', recommendation.outerLayer.colorCategory)}
            </p>
          </div>
        ) : null}

        {isRecorded ? (
          <div className="rounded-[1rem] border border-[var(--color-primary)]/10 bg-[var(--color-secondary)] px-4 py-3 text-sm font-medium text-[var(--color-primary)]">
            今日已记录
          </div>
        ) : isConfirming ? (
          <div className="space-y-3 rounded-[1.25rem] border border-black/5 bg-white/80 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">给这套一个满意度</p>
              <p className="text-sm text-[var(--color-neutral-dark)]">选 1-5 分后提交，系统会把它记成今天的记录。</p>
            </div>
            <div className="grid grid-cols-5 gap-2">
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
            <div className="flex flex-col gap-2 sm:flex-row">
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
