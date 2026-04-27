'use client'

import { useState } from 'react'
import Image from 'next/image'
import { sendBetaIssueFromClient } from '@/lib/beta/telemetry'
import { ItemShowcase, type ItemShowcaseEntry } from '@/components/ui/item-showcase'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TodayStrategyScorePanel } from '@/components/today/today-strategy-score-panel'
import type { TodayFeedbackReasonTag, TodayOotdFeedbackInput, TodayOotdStatus, TodayRecommendation, TodayRecommendationMissingSlot } from '@/lib/today/types'

const likeReasonTags: Array<{ tag: TodayFeedbackReasonTag; label: string }> = [
  { tag: 'like_color', label: '颜色好看' },
  { tag: 'like_silhouette', label: '比例好' },
  { tag: 'like_layering', label: '层次好' },
  { tag: 'like_shoes_bag', label: '鞋包搭得好' },
  { tag: 'like_scene_fit', label: '适合今天' },
  { tag: 'like_comfort', label: '看起来舒服' },
  { tag: 'like_freshness', label: '有新鲜感' }
]

const dislikeReasonTags: Array<{ tag: TodayFeedbackReasonTag; label: string }> = [
  { tag: 'dislike_color', label: '颜色不喜欢' },
  { tag: 'dislike_silhouette', label: '比例不好' },
  { tag: 'dislike_too_complex', label: '层次太复杂' },
  { tag: 'dislike_too_plain', label: '太普通' },
  { tag: 'dislike_too_bold', label: '太夸张' },
  { tag: 'dislike_shoes', label: '鞋子不搭' },
  { tag: 'dislike_scene_fit', label: '不适合今天' },
  { tag: 'dislike_comfort', label: '不够舒服' },
  { tag: 'dislike_item', label: '不想穿这件单品' }
]

const missingSlotLabels: Record<TodayRecommendationMissingSlot, string> = {
  top: '上装',
  bottom: '下装',
  dress: '主件',
  outerLayer: '外层',
  shoes: '鞋履',
  bag: '包袋',
  accessories: '配饰'
}

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

function CompactOutfitPreview({ items }: { items: ItemShowcaseEntry[] }) {
  if (items.length === 0) {
    return null
  }

  const visibleLimit = items.length > 6 ? 5 : 6
  const visibleItems = items.slice(0, visibleLimit)
  const remainingCount = items.length - visibleItems.length

  return (
    <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-white/78 p-3 shadow-[0_12px_26px_rgba(17,14,9,0.05)]">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {visibleItems.map((item) => (
          <div key={item.id} className="relative aspect-square overflow-hidden rounded-[0.85rem] border border-[var(--color-line)] bg-white">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.label}
                fill
                unoptimized
                className="object-contain p-1"
                sizes="72px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-1.5 text-center text-[10px] font-semibold leading-4 text-[var(--color-neutral-dark)]">
                {item.label}
              </div>
            )}
          </div>
        ))}
        {remainingCount > 0 ? (
          <div className="flex aspect-square items-center justify-center rounded-[0.85rem] border border-[var(--color-line)] bg-[var(--color-secondary)] text-sm font-semibold text-[var(--color-primary)]">
            +{remainingCount}
          </div>
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">核心单品</p>
        <p className="text-sm leading-6 text-[var(--color-primary)]">{items.map((item) => item.label).join(' / ')}</p>
      </div>
    </div>
  )
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
  submitOotd: (input: TodayOotdFeedbackInput) => Promise<{ error: string | null; wornAt: string | null }>
}) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [selectedScore, setSelectedScore] = useState<number | null>(null)
  const [selectedReasonTags, setSelectedReasonTags] = useState<TodayFeedbackReasonTag[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const isRecorded = ootdStatus.status === 'recorded' && recordedRecommendationId === recommendation.id
  const isLocked = ootdStatus.status === 'recorded' && !isRecorded
  const rankLabel = String(index).padStart(2, '0')
  const outfitItems = [
    toShowcaseItem(recommendation.dress),
    toShowcaseItem(recommendation.top),
    toShowcaseItem(recommendation.bottom),
    toShowcaseItem(recommendation.outerLayer),
    toShowcaseItem(recommendation.shoes ?? null),
    toShowcaseItem(recommendation.bag ?? null),
    ...(recommendation.accessories ?? []).map((item) => toShowcaseItem(item))
  ].filter((item): item is ItemShowcaseEntry => item !== null)
  const accessoryItems = [
    toShowcaseItem(recommendation.shoes ?? null),
    toShowcaseItem(recommendation.bag ?? null),
    ...(recommendation.accessories ?? []).map((item) => toShowcaseItem(item))
  ].filter((item): item is ItemShowcaseEntry => item !== null)
  const missingSlots = recommendation.missingSlots ?? []
  const confidence = recommendation.confidence ?? null
  const isInspiration = recommendation.mode === 'inspiration'
  const reasonHighlights = (recommendation.reasonHighlights ?? []).filter(Boolean).slice(0, 3)

  function toggleReasonTag(tag: TodayFeedbackReasonTag) {
    setSelectedReasonTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    )
  }

  function renderReasonGroup(title: string, reasons: Array<{ tag: TodayFeedbackReasonTag; label: string }>) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-dark)]">{title}</p>
        <div className="flex flex-wrap gap-2">
          {reasons.map((reason) => {
            const selected = selectedReasonTags.includes(reason.tag)

            return (
              <SecondaryButton
                key={reason.tag}
                type="button"
                aria-pressed={selected}
                className={selected ? 'border-[var(--color-primary)] bg-[var(--color-accent)] text-[var(--color-primary)]' : ''}
                onClick={() => toggleReasonTag(reason.tag)}
              >
                {reason.label}
              </SecondaryButton>
            )
          })}
        </div>
      </div>
    )
  }

  const recordingControl = isRecorded ? (
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
        {[1, 2, 3, 4, 5].map((score) => {
          const selected = selectedScore === score

          return (
            <SecondaryButton
              key={score}
              type="button"
              aria-pressed={selected}
              className={selected ? 'border-[var(--color-primary)] bg-[var(--color-accent)] text-[var(--color-primary)]' : ''}
              onClick={() => setSelectedScore(score)}
            >
              {score} 分
            </SecondaryButton>
          )
        })}
      </div>
      <div className="space-y-4 rounded-[1.1rem] border border-[var(--color-line)] bg-white/62 p-3">
        {renderReasonGroup('喜欢原因', likeReasonTags)}
        {renderReasonGroup('不喜欢原因', dislikeReasonTags)}
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
              satisfactionScore: selectedScore ?? 0,
              reasonTags: selectedReasonTags
            })
            setIsSubmitting(false)

            if (result.error) {
              void sendBetaIssueFromClient({
                code: 'today_ootd_submit_failed',
                surface: 'today_card',
                recoverable: true,
                context: {
                  recommendationId: recommendation.id
                }
              })
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
            setSelectedReasonTags([])
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
        setSelectedReasonTags([])
        setError(null)
      }}
    >
      记为今日已穿并评分
    </PrimaryButton>
  )

  return (
    <Card className="overflow-visible bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(241,234,224,0.94)_100%)]">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.1rem] border border-[var(--color-line)] bg-[var(--color-primary)] text-sm font-semibold text-white shadow-[0_14px_24px_rgba(0,0,0,0.16)]">
              {rankLabel}
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-dark)]">
                {isInspiration ? '灵感套装' : '搭配方案'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xl font-semibold tracking-[-0.05em] text-[var(--color-primary)]">第 {index} 套</p>
                {isInspiration ? (
                  <span className="rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                    灵感套装
                  </span>
                ) : null}
                {confidence !== null ? (
                  <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-[var(--color-neutral-dark)]">
                    完整度 {confidence}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {isRecorded ? (
            <span className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-sm font-semibold text-[var(--color-primary)]">
              已完成
            </span>
          ) : null}
        </div>

        <CompactOutfitPreview items={outfitItems} />

        {missingSlots.length > 0 ? (
          <div className="rounded-[1rem] border border-[var(--color-line)] bg-white/68 px-3 py-2 text-sm font-medium text-[var(--color-neutral-dark)]">
            待补 {missingSlots.map((slot) => missingSlotLabels[slot]).join('、')}
          </div>
        ) : null}

        {recordingControl}

        <div className="rounded-[1.25rem] border border-[rgba(9,9,9,0.12)] bg-[var(--color-panel)] p-3 text-white shadow-[0_16px_32px_rgba(0,0,0,0.12)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/52">为什么推荐这套</p>
          {reasonHighlights.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {reasonHighlights.map((highlight) => (
                <li key={highlight} className="flex gap-2 text-sm leading-6 text-white/82">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-6 text-white/82">{recommendation.reason}</p>
          )}
          {isInspiration ? (
            <div className="mt-3 rounded-[1rem] border border-white/12 bg-white/8 px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
                {recommendation.inspirationReason ?? '灵感套装'}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/78">
                {recommendation.dailyDifference ?? '这套比你的日常推荐多一点变化，但仍保留天气、场景和配色底线。'}
              </p>
            </div>
          ) : null}
        </div>

        <TodayStrategyScorePanel scoreBreakdown={recommendation.scoreBreakdown} />

        <SecondaryButton
          type="button"
          className="w-full"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((current) => !current)}
        >
          {showDetails ? '收起单品详情' : '展开单品详情'}
        </SecondaryButton>

        {showDetails ? (
          <div className="space-y-4 rounded-[1.35rem] border border-[var(--color-line)] bg-white/52 p-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">单品详情</p>
              <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">展开后查看每个 slot 的颜色、类别和补齐建议。</p>
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

            {accessoryItems.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-neutral-dark)]">
                  <span className="rounded-full bg-[var(--color-secondary)] px-2.5 py-1 text-[var(--color-primary)]">
                    鞋包配饰
                  </span>
                  <span>完成度补充</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {recommendation.shoes ? (
                    <ItemShowcase
                      items={[toShowcaseItem(recommendation.shoes)].filter((item): item is ItemShowcaseEntry => item !== null)}
                      title="鞋履"
                      subtitle={itemLabel('颜色', recommendation.shoes.colorCategory)}
                      compact
                    />
                  ) : null}
                  {recommendation.bag ? (
                    <ItemShowcase
                      items={[toShowcaseItem(recommendation.bag)].filter((item): item is ItemShowcaseEntry => item !== null)}
                      title="包袋"
                      subtitle={itemLabel('颜色', recommendation.bag.colorCategory)}
                      compact
                    />
                  ) : null}
                  {(recommendation.accessories ?? []).length > 0 ? (
                    <ItemShowcase
                      items={(recommendation.accessories ?? []).map(toShowcaseItem).filter((item): item is ItemShowcaseEntry => item !== null)}
                      title="配饰"
                      subtitle={(recommendation.accessories ?? []).map((item) => item.subCategory ?? item.category).join(' / ')}
                      compact
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {missingSlots.length > 0 ? (
              <div className="rounded-[1.2rem] border border-[var(--color-line)] bg-white/68 px-4 py-3 text-sm leading-6 text-[var(--color-neutral-dark)]">
                这套还缺 {missingSlots.map((slot) => missingSlotLabels[slot]).join('、')}，可以先按主组合穿，后续在衣橱里补齐会更完整。
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  )
}
