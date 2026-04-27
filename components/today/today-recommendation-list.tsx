'use client'

import { useEffect, useRef } from 'react'
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
  onContinuationCueVisible
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
  onContinuationCueVisible?: () => void
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const cueRef = useRef<HTMLDivElement | null>(null)
  const isContinuationCueArmedRef = useRef(true)

  useEffect(() => {
    const cue = cueRef.current

    if (!cue || !onContinuationCueVisible || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver((entries) => {
      const isIntersecting = entries.some((entry) => entry.isIntersecting)

      if (!isIntersecting) {
        isContinuationCueArmedRef.current = true
        return
      }

      if (isContinuationCueArmedRef.current) {
        isContinuationCueArmedRef.current = false
        onContinuationCueVisible()
      }
    }, {
      root: scrollerRef.current,
      rootMargin: '0px 65% 0px 0px',
      threshold: 0.1
    })

    observer.observe(cue)
    return () => observer.disconnect()
  }, [onContinuationCueVisible, recommendations.length])

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
    : `左滑继续看 · 已有 ${recommendations.length} 套`

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

      <div
        ref={scrollerRef}
        aria-busy={isRefreshing}
        className={`-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 transition-opacity duration-200 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden ${isRefreshing ? 'opacity-72' : 'opacity-100'}`}
      >
        {recommendations.map((recommendation, index) => (
          <div key={recommendation.id} className="min-w-full snap-center sm:min-w-0">
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
        {onContinuationCueVisible ? (
          <div ref={cueRef} className="min-w-[78%] snap-center sm:hidden">
            <div
              className={`relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden rounded-[1.35rem] border p-4 shadow-[0_16px_32px_rgba(17,14,9,0.08)] ${
                cueIsInspiration
                  ? 'ootoday-inspiration-cue border-[var(--color-accent)] bg-[linear-gradient(145deg,rgba(231,255,55,0.96),rgba(255,255,255,0.96)_52%,rgba(255,122,89,0.28))] text-[var(--color-primary)]'
                  : 'border-[var(--color-line)] bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(239,232,220,0.92))] text-[var(--color-primary)]'
              }`}
              aria-label={cueIsInspiration ? '继续滑动生成灵感推荐' : '继续滑动生成常规推荐'}
            >
              <div className="space-y-3">
                {cueIsInspiration ? (
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                      Inspiration
                    </span>
                    <span className="ootoday-inspiration-spark h-8 w-8 rounded-full border border-[var(--color-primary)]/15 bg-white/78" />
                  </div>
                ) : null}
                <div className={`grid grid-cols-3 gap-2 ${cueIsInspiration ? 'ootoday-inspiration-tiles' : ''}`}>
                  {Array.from({ length: 6 }, (_, index) => (
                    <span
                      key={index}
                      className={`h-14 rounded-[0.85rem] ${
                        cueIsInspiration
                          ? index % 2 === 0 ? 'bg-[var(--color-primary)]' : 'bg-white/84'
                          : index % 2 === 0 ? 'bg-[var(--color-neutral)]' : 'bg-white'
                      } ${isContinuationLoading ? 'animate-pulse' : ''}`}
                    />
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-72">
                    {cueIsInspiration ? 'Inspiration' : 'Next outfit'}
                  </p>
                  <p className={`${cueIsInspiration ? 'ootoday-inspiration-title text-3xl' : 'text-2xl'} font-semibold leading-tight tracking-normal`}>
                    {isContinuationLoading ? cueIsInspiration ? '灵感正在到来...' : '正在刷新...' : cueIsInspiration ? '灵感到来！继续滑' : '继续滑，换一套'}
                  </p>
                </div>
              </div>
              <p className="relative text-sm font-medium leading-6 opacity-78">
                {cueIsInspiration ? '下一套会更有风格试探，但仍守住天气、场景和避雷底线。' : '普通色块提示这次是常规推荐。'}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
