'use client'

import { useState } from 'react'
import { ItemShowcase, type ItemShowcaseEntry } from '@/components/ui/item-showcase'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { TodayOotdStatus, TodayRecommendation } from '@/lib/today/types'

function itemLabel(label: string, value: string | null) {
  return value ? `${label}：${value}` : `${label}：待补充`
}

function toShowcaseItem(item: TodayRecommendation['top']): ItemShowcaseEntry | null {
  if (!item) {
    return null
  }

  return {
    id: item.id,
    imageUrl: item.imageUrl,
    label: item.subCategory ?? item.category,
    meta: [item.colorCategory, item.styleTags[0]].filter(Boolean).join(' · ')
  }
}

export function TodayRecommendationCard({
  recommendation,
  index,
  ootdStatus,
  recordedRecommendationId,
  submitOotd
}: {
  recommendation: TodayRecommendation
  index: number
  ootdStatus: TodayOotdStatus
  recordedRecommendationId: string | null
  submitOotd: (input: {
    recommendation: TodayRecommendation
    satisfactionScore: number
  }) => Promise<{ error: string | null; wornAt: string | null }>
}) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRecorded = ootdStatus.status === 'recorded' && recordedRecommendationId === recommendation.id
  const isLocked = ootdStatus.status === 'recorded' && !isRecorded
  const rankLabel = String(index).padStart(2, '0')
  const outfitItems = [
    toShowcaseItem(recommendation.dress),
    toShowcaseItem(recommendation.top),
    toShowcaseItem(recommendation.bottom),
    toShowcaseItem(recommendation.outerLayer)
  ].filter((item): item is ItemShowcaseEntry => item !== null)

  return (
    <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(241,234,224,0.94)_100%)]">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] border border-[var(--color-line)] bg-[var(--color-primary)] text-sm font-semibold text-white shadow-[0_14px_24px_rgba(0,0,0,0.16)]">
              {rankLabel}
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-dark)]">搭配方案</p>
              <p className="text-xl font-semibold tracking-[-0.05em] text-[var(--color-primary)]">第 {index} 套</p>
            </div>
          </div>
          {isRecorded ? (
            <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-sm font-semibold text-[var(--color-primary)]">
              已完成
            </span>
          ) : null}
        </div>

        <div className="rounded-[1.6rem] bg-[var(--color-panel)] p-5 text-white shadow-[var(--shadow-strong)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">为什么推荐这套</p>
          <p className="mt-3 text-base leading-8 text-white/82 sm:text-sm sm:leading-7">{recommendation.reason}</p>
        </div>

        {outfitItems.length > 0 ? (
          <ItemShowcase
            items={outfitItems}
            title="整套预览"
            subtitle={outfitItems.map((item) => item.label).join(' / ')}
          />
        ) : null}

        {recommendation.dress ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-dark)]">
              <span className="rounded-full bg-[var(--color-secondary)] px-2.5 py-1 text-[var(--color-primary)]">
                一件式
              </span>
              <span>主件 / 颜色 / 风格</span>
            </div>
            <ItemShowcase
              items={[toShowcaseItem(recommendation.dress)].filter((item): item is ItemShowcaseEntry => item !== null)}
              title={recommendation.dress.subCategory ?? recommendation.dress.category}
              subtitle={[
                itemLabel('颜色', recommendation.dress.colorCategory),
                recommendation.dress.styleTags.slice(0, 2).join(' / ')
              ]
                .filter(Boolean)
                .join(' · ')}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-dark)]">
              <span className="rounded-full bg-[var(--color-secondary)] px-2.5 py-1 text-[var(--color-primary)]">
                上下装
              </span>
              <span>主件 / 外层</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ItemShowcase
                items={[
                  toShowcaseItem(recommendation.top) ?? {
                    id: 'missing-top',
                    imageUrl: null,
                    label: '待补充上装'
                  }
                ]}
                title="上装"
                subtitle={itemLabel('颜色', recommendation.top?.colorCategory ?? null)}
              />

              <ItemShowcase
                items={[
                  toShowcaseItem(recommendation.bottom) ?? {
                    id: 'missing-bottom',
                    imageUrl: null,
                    label: '待补充下装'
                  }
                ]}
                title="下装"
                subtitle={itemLabel('颜色', recommendation.bottom?.colorCategory ?? null)}
              />
            </div>
          </div>
        )}

        {recommendation.outerLayer ? (
          <div className="rounded-[1.4rem] bg-[linear-gradient(180deg,rgba(231,255,55,0.18),rgba(231,255,55,0.1))] p-1">
            <ItemShowcase
              items={[toShowcaseItem(recommendation.outerLayer)].filter((item): item is ItemShowcaseEntry => item !== null)}
              title="外层建议"
              subtitle={itemLabel('颜色', recommendation.outerLayer.colorCategory)}
            />
          </div>
        ) : null}

        {isRecorded ? (
          <div className="rounded-[1.2rem] border border-[var(--color-line)] bg-white/64 px-4 py-3 text-sm font-medium text-[var(--color-primary)]">
            今日已记录
          </div>
        ) : isLocked ? (
          <div className="rounded-[1.2rem] border border-[var(--color-line)] bg-white/64 px-4 py-3 text-sm font-medium text-[var(--color-neutral-dark)]">
            今天已记录，其他方案暂时锁定
          </div>
        ) : isConfirming ? (
          <div className="space-y-3 rounded-[1.4rem] border border-[var(--color-line)] bg-white/72 p-4">
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
