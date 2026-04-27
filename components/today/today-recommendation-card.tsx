'use client'

import { useState } from 'react'
import { sendBetaIssueFromClient } from '@/lib/beta/telemetry'
import { ItemShowcase, type ItemShowcaseEntry } from '@/components/ui/item-showcase'
import { PrimaryButton, SecondaryButton } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TodayStrategyScorePanel } from '@/components/today/today-strategy-score-panel'
import { getTodayDecisionRole } from '@/components/today/today-decision-role'
import { TodayOutfitHero } from '@/components/today/today-outfit-hero'
import { getReplaceableSlots, getSlotDisplayLabel } from '@/components/today/today-slot-replacement-actions'
import type {
  TodayChooseRecommendationInput,
  TodayFeedbackReasonTag,
  TodayOotdStatus,
  TodayPreChoiceFeedbackInput,
  TodayRecommendation,
  TodayRecommendationMissingSlot,
  TodayReplaceableSlot,
  TodayScene,
  TodaySlotReplacementInput,
  TodaySlotReplacementResult,
  TodayTargetDate,
  TodayWeatherState
} from '@/lib/today/types'

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

function slotRejectedIds(recommendation: TodayRecommendation, slot: TodayReplaceableSlot | null, replaceItemId?: string) {
  if (!slot) {
    return []
  }

  if (slot === 'accessories') {
    if (replaceItemId) {
      return [replaceItemId]
    }

    return (recommendation.accessories ?? []).map((item) => item.id)
  }

  return [recommendation[slot]?.id].filter((id): id is string => Boolean(id))
}

export function TodayRecommendationCard({
  recommendation,
  index,
  recommendationSequenceNumber,
  variant = 'compact',
  ootdStatus,
  recordedRecommendationId,
  weatherState,
  targetDate = 'today',
  scene = null,
  showFirstLoopHint = false,
  onDismissFirstLoopHint,
  chooseRecommendation,
  undoTodaySelection,
  replaceSlot,
  submitPreChoiceFeedback,
  recordOpened
}: {
  recommendation: TodayRecommendation
  index: number
  recommendationSequenceNumber?: number
  variant?: 'hero' | 'compact'
  ootdStatus: TodayOotdStatus
  recordedRecommendationId: string | null
  weatherState: TodayWeatherState
  targetDate?: TodayTargetDate
  scene?: TodayScene
  showFirstLoopHint?: boolean
  onDismissFirstLoopHint?: () => void
  chooseRecommendation: (input: TodayChooseRecommendationInput) => Promise<{ error: string | null; wornAt: string | null }>
  undoTodaySelection: () => Promise<{ error: string | null }>
  replaceSlot: (input: TodaySlotReplacementInput) => Promise<TodaySlotReplacementResult>
  submitPreChoiceFeedback: (input: TodayPreChoiceFeedbackInput) => Promise<{ error: string | null }>
  recordOpened: (input: TodayChooseRecommendationInput & { source: 'details' | 'quick_feedback' }) => Promise<{ error: string | null }>
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChoosing, setIsChoosing] = useState(false)
  const [isUndoing, setIsUndoing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [choiceError, setChoiceError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [replacingSlot, setReplacingSlot] = useState<TodayReplaceableSlot | null>(null)
  const [pendingReplacementSlot, setPendingReplacementSlot] = useState<TodayReplaceableSlot | null>(null)
  const [pendingReplacementItemId, setPendingReplacementItemId] = useState<string | null>(null)
  const [replacementError, setReplacementError] = useState<string | null>(null)
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null)
  const [isVisuallyLowered, setIsVisuallyLowered] = useState(false)

  const isRecorded = ootdStatus.status === 'recorded' && recordedRecommendationId === recommendation.id
  const hasRecordedOutfit = ootdStatus.status === 'recorded'
  const rankLabel = String(index + 1).padStart(2, '0')
  const sequenceLabel = recommendationSequenceNumber ? `今日第 ${recommendationSequenceNumber} 套` : null
  const confidence = recommendation.confidence ?? null
  const isInspiration = recommendation.mode === 'inspiration'
  const sequencePillClassName = isInspiration
    ? 'relative isolate shrink-0 overflow-hidden rounded-full border border-[var(--color-accent)] bg-[linear-gradient(135deg,rgba(231,255,55,0.98),rgba(255,255,255,0.94)_62%,rgba(255,122,89,0.24))] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-primary)] shadow-[0_0_0_3px_rgba(231,255,55,0.24),0_12px_26px_rgba(17,14,9,0.13)]'
    : 'shrink-0 rounded-full border border-[var(--color-line)] bg-white/84 px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] shadow-[0_10px_22px_rgba(17,14,9,0.08)]'
  const reasonHighlights = (recommendation.reasonHighlights ?? []).filter(Boolean).slice(0, 3)
  const role = getTodayDecisionRole({ index, scene, recommendation })
  const missingSlots = recommendation.missingSlots ?? []
  const replaceableSlots = getReplaceableSlots(recommendation)
  const hasPositiveFeedback = Boolean(feedbackNotice)
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

  async function chooseForToday() {
    if (hasRecordedOutfit) {
      return
    }

    setIsChoosing(true)
    setChoiceError(null)
    const result = await chooseRecommendation({
      recommendation,
      targetDate,
      scene
    })
    setIsChoosing(false)

    if (result.error) {
      setChoiceError(result.error)
    }
  }

  async function undoChoice() {
    setIsUndoing(true)
    setChoiceError(null)
    const result = await undoTodaySelection()
    setIsUndoing(false)

    if (result.error) {
      setChoiceError(result.error)
    }
  }

  async function replaceRecommendationSlot(slot: TodayReplaceableSlot, replaceItemId?: string, reasonTags: TodayFeedbackReasonTag[] = []) {
    setReplacingSlot(slot)
    setReplacementError(null)
    const result = await replaceSlot({
      recommendation,
      slot,
      ...(replaceItemId ? { replaceItemId } : {}),
      rejectedItemIds: slotRejectedIds(recommendation, slot, replaceItemId),
      reasonTags,
      targetDate,
      scene
    })
    setReplacingSlot(null)

    if (result.error) {
      setReplacementError(result.error)
    }

    return result
  }

  async function submitPositiveFeedback() {
    if (hasPositiveFeedback) {
      return
    }

    setIsSubmitting(true)
    setError(null)
    setFeedbackError(null)
    setFeedbackNotice(null)
    const result = await submitPreChoiceFeedback({
      recommendation,
      scope: 'outfit',
      itemIds: outfitItems.map((item) => item.id),
      reasonTags: [],
      preferenceSignal: 'positive',
      targetDate,
      scene
    })
    setIsSubmitting(false)

    if (result.error) {
      void sendBetaIssueFromClient({
        code: 'today_preference_feedback_failed',
        surface: 'today_card',
        recoverable: true,
        context: {
          recommendationId: recommendation.id
        }
      })
      setError(result.error)
      return
    }

    setFeedbackNotice('AI 穿搭引擎又多懂了你一点。')
  }

  async function submitDislikeFeedback() {
    setIsFeedbackSubmitting(true)
    setFeedbackError(null)
    setFeedbackNotice(null)
    const result = await submitPreChoiceFeedback({
      recommendation,
      scope: 'outfit',
      itemIds: outfitItems.map((item) => item.id),
      reasonTags: ['dislike_item'],
      preferenceSignal: 'negative',
      targetDate,
      scene
    })
    setIsFeedbackSubmitting(false)

    if (result.error) {
      setFeedbackError(result.error)
      return
    }

    setIsVisuallyLowered(true)
  }

  async function confirmReplacement() {
    if (!pendingReplacementSlot) {
      return
    }

    const slot = pendingReplacementSlot
    const result = await replaceRecommendationSlot(slot, pendingReplacementItemId ?? undefined)

    if (!result.error) {
      setPendingReplacementSlot(null)
      setPendingReplacementItemId(null)
    }
  }

  const replacementDialog = pendingReplacementSlot ? (
    <div className="absolute inset-0 z-50 flex items-start justify-center rounded-[1.9rem] bg-black/28 px-4 pt-8 backdrop-blur-[2px] sm:pt-10">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`确认更换${getSlotDisplayLabel(pendingReplacementSlot)}`}
        className="w-full max-w-sm rounded-[1.35rem] border border-white/55 bg-white/96 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
      >
        <div className="space-y-2">
          <p className="text-base font-semibold text-[var(--color-primary)]">确认更换{getSlotDisplayLabel(pendingReplacementSlot)}？</p>
          <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">系统会在你的衣橱里找一个更合适的替代单品，并保留这套方案的其他部分。</p>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <PrimaryButton
            type="button"
            disabled={Boolean(replacingSlot)}
            onClick={() => void confirmReplacement()}
          >
            {replacingSlot === pendingReplacementSlot ? '正在更换...' : '确认更换'}
          </PrimaryButton>
          <SecondaryButton
            type="button"
            disabled={Boolean(replacingSlot)}
            onClick={() => {
              setPendingReplacementSlot(null)
              setPendingReplacementItemId(null)
            }}
          >
            取消
          </SecondaryButton>
        </div>
      </div>
    </div>
  ) : null

  const choiceControl = isRecorded ? (
    <div className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-[var(--color-accent)]/50 bg-[var(--color-accent)]/18 px-3 py-2 text-sm font-medium text-[var(--color-primary)]">
      <span>今日已选择</span>
      <button
        type="button"
        className="inline-flex min-h-8 items-center justify-center rounded-full border border-[var(--color-primary)]/10 bg-white/78 px-3 text-xs font-semibold text-[var(--color-primary)] shadow-[0_8px_16px_rgba(17,14,9,0.08)] disabled:opacity-55"
        disabled={isUndoing}
        onClick={() => void undoChoice()}
      >
        {isUndoing ? '撤销中...' : '撤销'}
      </button>
    </div>
  ) : (
    <div
      data-testid="today-decision-prompt"
      className="space-y-2 rounded-[1rem] border border-[var(--color-line)] bg-white/56 px-3 py-2 text-xs font-medium text-[var(--color-neutral-dark)]"
    >
      <p>{hasRecordedOutfit ? '今天已选择另一套，这套仍可继续反馈。' : '先选择已穿，再用反馈微调推荐。'}</p>
      {feedbackNotice ? (
        <p role="status" className="border-t border-[var(--color-line)]/70 pt-2 text-sm font-semibold text-[var(--color-primary)]">
          {feedbackNotice}
        </p>
      ) : null}
    </div>
  )

  const decisionControl = (
    <div className="space-y-2">
      {choiceControl}
      <div className="grid grid-cols-3 gap-2">
        <PrimaryButton
          type="button"
          className="min-h-11 px-2 text-xs"
          disabled={isChoosing || hasRecordedOutfit}
          onClick={() => void chooseForToday()}
        >
          {isRecorded ? '已选择' : isChoosing ? '选择中...' : hasRecordedOutfit ? '已选其他' : '就穿这个'}
        </PrimaryButton>
        <PrimaryButton
          type="button"
          aria-pressed={hasPositiveFeedback}
          className={`min-h-11 border border-[var(--color-primary)]/10 px-2 text-xs shadow-[0_14px_28px_rgba(17,14,9,0.13)] hover:shadow-[0_18px_34px_rgba(17,14,9,0.16)] ${
            hasPositiveFeedback
              ? '!bg-[var(--color-primary)] !text-white'
              : '!bg-[var(--color-accent)] !text-[var(--color-primary)] hover:!bg-[var(--color-accent)]/90'
          }`}
          disabled={isSubmitting || isFeedbackSubmitting || hasPositiveFeedback}
          onClick={() => void submitPositiveFeedback()}
        >
          {isSubmitting ? '正在记录...' : hasPositiveFeedback ? '已反馈' : '还不错'}
        </PrimaryButton>
        <SecondaryButton
          type="button"
          className="min-h-11 px-2 text-xs"
          disabled={isSubmitting || isFeedbackSubmitting}
          onClick={() => void submitDislikeFeedback()}
        >
          {isFeedbackSubmitting ? '正在保存...' : '不喜欢'}
        </SecondaryButton>
      </div>
      {choiceError ? <p className="text-sm text-red-600">{choiceError}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {feedbackError ? <p className="text-sm text-red-600">{feedbackError}</p> : null}
    </div>
  )

  return (
    <Card className={`overflow-visible bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(241,234,224,0.94)_100%)] ${isRecorded ? 'ring-2 ring-[var(--color-accent)]/70' : ''} ${isVisuallyLowered ? 'opacity-60' : ''}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-neutral-dark)]">
              {isInspiration ? '灵感套装' : 'Today outfit'} · {rankLabel}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`${variant === 'hero' ? 'text-2xl' : 'text-xl'} bg-[linear-gradient(180deg,transparent_58%,rgba(231,255,55,0.48)_58%)] px-0.5 font-semibold leading-tight tracking-normal text-[var(--color-primary)]`}>
                {role.label}
              </h2>
              {confidence !== null ? (
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-[var(--color-neutral-dark)]">
                  完整度 {confidence}
                </span>
              ) : null}
              {isRecorded ? (
                <span className="rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  已选择
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">{role.description}</p>
          </div>
          {sequenceLabel ? (
            <span
              aria-label={`今天第 ${recommendationSequenceNumber} 套推荐`}
              className={sequencePillClassName}
            >
              {isInspiration ? (
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 text-[10px] leading-none text-[var(--color-primary)]/28">
                  <span className="absolute left-2 top-1">✦</span>
                  <span className="absolute right-3 top-1.5">✧</span>
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2">✦</span>
                </span>
              ) : null}
              <span className="relative z-10">{sequenceLabel}</span>
            </span>
          ) : null}
        </div>

        <TodayOutfitHero
          recommendation={recommendation}
          variant={variant}
          weatherState={weatherState}
          replaceableSlots={!isRecorded ? replaceableSlots : []}
          replacingSlot={replacingSlot}
          priority={index === 0}
          onRequestReplace={(slot, item) => {
            setReplacementError(null)
            setPendingReplacementSlot(slot)
            setPendingReplacementItemId(item?.id ?? null)
          }}
        />

        {missingSlots.length > 0 ? (
          <div className="rounded-[1rem] border border-[var(--color-line)] bg-white/68 px-3 py-2 text-sm font-medium text-[var(--color-neutral-dark)]">
            待补 {missingSlots.map((slot) => missingSlotLabels[slot]).join('、')}
          </div>
        ) : null}

        {isVisuallyLowered ? (
          <div className="rounded-[1rem] border border-[var(--color-line)] bg-white/68 px-3 py-2 text-sm leading-6 text-[var(--color-neutral-dark)]">
            已记录这套暂时不想穿。可以继续看下面方案，或使用“换一批推荐”。
          </div>
        ) : null}

        {decisionControl}

        {replacementError ? <p className="text-sm text-red-600">{replacementError}</p> : null}
        {replacementDialog}

        {showFirstLoopHint ? (
          <div className="rounded-[1rem] border border-[var(--color-line)] bg-white/68 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">第一次选择会让下一轮推荐更像你。</p>
              {onDismissFirstLoopHint ? (
                <button
                  type="button"
                  aria-label="关闭 first loop 提示"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-white/76 text-base leading-none text-[var(--color-primary)]"
                  onClick={onDismissFirstLoopHint}
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

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
          onClick={() => {
            const shouldOpen = !showDetails
            setShowDetails(shouldOpen)
            if (shouldOpen) {
              void recordOpened({ recommendation, targetDate, scene, source: 'details' })
            }
          }}
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
            ) : (
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
            )}

            {recommendation.outerLayer ? (
              <ItemShowcase
                items={[toShowcaseItem(recommendation.outerLayer)].filter((item): item is ItemShowcaseEntry => item !== null)}
                title="外层建议"
                subtitle={itemLabel('颜色', recommendation.outerLayer.colorCategory)}
              />
            ) : null}

            {accessoryItems.length > 0 ? (
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
