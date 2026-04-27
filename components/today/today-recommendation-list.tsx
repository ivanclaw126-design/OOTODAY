'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { FeedbackLink } from '@/components/beta/feedback-link'
import { TodayRecommendationCard } from '@/components/today/today-recommendation-card'
import type {
  TodayChooseRecommendationInput,
  TodayOotdStatus,
  TodayPreChoiceFeedbackInput,
  TodayRecommendation,
  TodayRecommendationMode,
  TodayScene,
  TodaySlotReplacementInput,
  TodaySlotReplacementResult,
  TodayTargetDate,
  TodayWeatherState
} from '@/lib/today/types'

const sceneLabels: Record<Exclude<TodayScene, null>, string> = {
  work: '通勤干净',
  casual: '轻松日常',
  date: '约会聚会',
  travel: '城市旅行',
  outdoor: '运动户外'
}

export function TodayRecommendationList({
  recommendations,
  recommendationError,
  ootdStatus,
  recordedRecommendationId,
  weatherState,
  targetDate = 'today',
  scene = null,
  showFirstLoopHint,
  onDismissFirstLoopHint,
  chooseRecommendation,
  undoTodaySelection,
  replaceSlot,
  submitPreChoiceFeedback,
  recordOpened,
  recommendationSequences = {},
  continuationMode,
  isRefreshing = false,
  isContinuationLoading = false,
  continuationVersion = 0,
  onContinuationRefresh
}: {
  recommendations: TodayRecommendation[]
  recommendationError: boolean
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
  recommendationSequences?: Record<string, number>
  continuationMode?: TodayRecommendationMode
  isRefreshing?: boolean
  isContinuationLoading?: boolean
  continuationVersion?: number
  onContinuationRefresh?: () => void
}) {
  const PULL_REFRESH_THRESHOLD = 82
  const MAX_PULL_DISTANCE = 118
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const thirdCardRef = useRef<HTMLDivElement | null>(null)
  const pullStartXRef = useRef<number | null>(null)
  const pullStartedAtEndRef = useRef(false)
  const pullDistanceRef = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)

  function isAtScrollEnd(element: HTMLDivElement) {
    return element.scrollLeft + element.clientWidth >= element.scrollWidth - 48
  }

  useEffect(() => {
    if (continuationVersion <= 0 || !thirdCardRef.current || typeof thirdCardRef.current.scrollIntoView !== 'function') {
      return
    }

    thirdCardRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    })
  }, [continuationVersion])

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

  const targetLabel = targetDate === 'tomorrow' ? '明天推荐' : '今日推荐'
  const headline = targetDate === 'tomorrow' ? '明天先看最推荐这套' : '今天先看最推荐这套'
  const sceneLabel = scene ? sceneLabels[scene] : '智能默认场景'
  const cueIsInspiration = continuationMode === 'inspiration'
  const swipeHint = isContinuationLoading
    ? cueIsInspiration ? '灵感正在到来' : '正在找下一套'
    : '滑到最右再左拖生成更多'
  const pullProgress = Math.min(1, pullDistance / PULL_REFRESH_THRESHOLD)
  const isPullReady = pullDistance >= PULL_REFRESH_THRESHOLD

  function resetPullState() {
    pullStartXRef.current = null
    pullStartedAtEndRef.current = false
    pullDistanceRef.current = 0
    setPullDistance(0)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!onContinuationRefresh || isContinuationLoading || isRefreshing || !scrollerRef.current) {
      return
    }

    if (!Number.isFinite(event.clientX)) {
      return
    }

    pullStartXRef.current = event.clientX
    pullStartedAtEndRef.current = isAtScrollEnd(scrollerRef.current)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const startX = pullStartXRef.current
    const scroller = scrollerRef.current

    if (startX === null || !scroller || !onContinuationRefresh || isContinuationLoading || isRefreshing) {
      return
    }

    if (!Number.isFinite(event.clientX)) {
      return
    }

    const shouldPull = pullStartedAtEndRef.current || isAtScrollEnd(scroller)
    const dragDistance = Math.max(0, startX - event.clientX)

    if (!shouldPull || dragDistance < 10) {
      if (pullDistanceRef.current > 0) {
        pullDistanceRef.current = 0
        setPullDistance(0)
      }
      return
    }

    event.preventDefault()
    pullStartedAtEndRef.current = true
    const nextPullDistance = Math.min(MAX_PULL_DISTANCE, dragDistance)
    pullDistanceRef.current = nextPullDistance
    setPullDistance(nextPullDistance)
  }

  function handlePointerEnd() {
    if (pullDistanceRef.current >= PULL_REFRESH_THRESHOLD && onContinuationRefresh && !isContinuationLoading && !isRefreshing) {
      onContinuationRefresh()
    }

    resetPullState()
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 border-b border-[var(--color-line)] pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase text-[var(--color-neutral-dark)]">
            <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] shadow-[0_0_0_4px_rgba(231,255,55,0.18)]" />
            {targetLabel}
          </p>
          <p className="max-w-2xl text-[2.05rem] font-semibold leading-[1.08] text-[var(--color-primary)] sm:text-[2.45rem]">
            {headline}
          </p>
          <p className="max-w-xl text-base font-medium leading-7 text-[var(--color-neutral-dark)]">
            按{targetDate === 'tomorrow' ? '明天' : '今天'}的{sceneLabel}、天气和最近穿着整理
          </p>
        </div>
        <div className="flex w-fit shrink-0 items-center gap-2 rounded-full border border-[var(--color-line)] bg-white/82 px-3 py-2 text-xs font-semibold text-[var(--color-primary)] shadow-[0_10px_22px_rgba(17,14,9,0.08)] sm:mb-1">
          <span className={`h-2 w-2 rounded-full ${cueIsInspiration ? 'ootoday-inspiration-dot bg-[var(--color-accent)]' : 'bg-[var(--color-accent)]'}`} />
          <span>{swipeHint}</span>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          data-testid="today-recommendation-rail"
          aria-busy={isRefreshing}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={resetPullState}
          onPointerLeave={handlePointerEnd}
          className={`-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 transition-opacity duration-200 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden ${isRefreshing ? 'opacity-72' : 'opacity-100'}`}
        >
          {recommendations.map((recommendation, index) => (
            <div key={recommendation.id} ref={index === 2 ? thirdCardRef : undefined} className="min-w-full snap-center sm:min-w-0">
              <TodayRecommendationCard
                recommendation={recommendation}
                index={index}
                recommendationSequenceNumber={recommendationSequences[recommendation.id] ?? index + 1}
                variant="hero"
                ootdStatus={ootdStatus}
                recordedRecommendationId={recordedRecommendationId}
                weatherState={weatherState}
                targetDate={targetDate}
                scene={scene}
                showFirstLoopHint={index === 0 ? showFirstLoopHint : false}
                onDismissFirstLoopHint={index === 0 ? onDismissFirstLoopHint : undefined}
                chooseRecommendation={chooseRecommendation}
                undoTodaySelection={undoTodaySelection}
                replaceSlot={replaceSlot}
                submitPreChoiceFeedback={submitPreChoiceFeedback}
                recordOpened={recordOpened}
              />
            </div>
          ))}
        </div>
        {onContinuationRefresh ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 right-0 top-0 flex w-[7.25rem] items-center justify-center overflow-hidden rounded-l-[1.25rem] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(231,255,55,0.24))] transition-opacity duration-150 sm:hidden"
            style={{ opacity: pullDistance > 0 || isContinuationLoading ? Math.max(0.22, pullProgress) : 0 }}
          >
            <div
              className="grid min-w-[5.9rem] place-items-center rounded-full border border-[var(--color-line)] bg-white/92 px-3 py-2 text-center text-xs font-semibold leading-5 text-[var(--color-primary)] shadow-[0_10px_22px_rgba(17,14,9,0.12)]"
              style={{ transform: `translateX(${Math.max(0, 38 - pullProgress * 38)}px)` }}
            >
              {isContinuationLoading ? '生成中' : isPullReady ? '松手生成' : '继续拖动'}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
