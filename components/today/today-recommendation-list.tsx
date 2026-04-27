import { EmptyState } from '@/components/ui/empty-state'
import { FeedbackLink } from '@/components/beta/feedback-link'
import { TodayRecommendationCard } from '@/components/today/today-recommendation-card'
import type {
  TodayChooseRecommendationInput,
  TodayOotdStatus,
  TodayPreChoiceFeedbackInput,
  TodayRecommendation,
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
  recordOpened
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

  const targetLabel = targetDate === 'tomorrow' ? '明天推荐' : '今日推荐'
  const headline = targetDate === 'tomorrow' ? '明天先看最推荐这套' : '今天先看最推荐这套'
  const sceneLabel = scene ? sceneLabels[scene] : '智能默认场景'

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase text-[var(--color-neutral-dark)]">{targetLabel}</p>
          <p className="text-[1.65rem] font-semibold text-[var(--color-primary)] sm:text-2xl">{headline}</p>
        </div>
        <div className="flex items-center justify-between gap-3 sm:block">
          <p className="max-w-xs text-sm leading-6 text-[var(--color-neutral-dark)]">按{targetDate === 'tomorrow' ? '明天' : '今天'}的{sceneLabel}、天气和最近穿着整理</p>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white/76 px-2 py-1 text-[10px] font-semibold text-[var(--color-primary)] shadow-[0_8px_16px_rgba(17,14,9,0.06)] sm:hidden">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            <span>左滑看第 2 / 3 套</span>
          </div>
        </div>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {recommendations.map((recommendation, index) => (
          <div key={recommendation.id} className="min-w-full snap-center sm:min-w-0">
            <TodayRecommendationCard
              recommendation={recommendation}
              index={index}
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
    </section>
  )
}
