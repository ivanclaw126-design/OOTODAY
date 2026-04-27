'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeedbackLink } from '@/components/beta/feedback-link'
import { TodayCityForm } from '@/components/today/today-city-form'
import { TodayCityPromptCard } from '@/components/today/today-city-prompt-card'
import { TodayOotdHistory } from '@/components/today/today-ootd-history'
import { TodayRecommendationList } from '@/components/today/today-recommendation-list'
import { TodayStatusCard } from '@/components/today/today-status-card'
import { SecondaryButton } from '@/components/ui/button'
import { buildOotdNotes } from '@/lib/today/build-ootd-notes'
import type {
  TodayHistoryUpdateInput,
  TodayOotdFeedbackInput,
  TodayOotdHistoryEntry,
  TodayOotdStatus,
  TodayRecommendation,
  TodayRecommendationRefreshInput,
  TodayRecommendationRefreshResult,
  TodayScene,
  TodayTargetDate,
  TodayView
} from '@/lib/today/types'

function isSameCalendarDay(left: string, right: string) {
  return new Date(left).toDateString() === new Date(right).toDateString()
}

function getRecordedRecommendationId({
  recommendations,
  ootdStatus,
  historyEntries
}: {
  recommendations: TodayRecommendation[]
  ootdStatus: TodayOotdStatus
  historyEntries: TodayOotdHistoryEntry[]
}) {
  if (ootdStatus.status !== 'recorded') {
    return null
  }

  const todayEntry = historyEntries.find((entry) => isSameCalendarDay(entry.wornAt, ootdStatus.wornAt))

  if (!todayEntry?.notes) {
    return null
  }

  return recommendations.find((recommendation) => buildOotdNotes(recommendation) === todayEntry.notes)?.id ?? null
}

export function TodayInteractiveWorkspace({
  view,
  updateCity,
  submitOotd,
  refreshRecommendations,
  updateHistoryEntry,
  deleteHistoryEntry
}: {
  view: TodayView
  updateCity: (input: { city: string }) => Promise<{ error: string | null }>
  submitOotd: (input: TodayOotdFeedbackInput) => Promise<{ error: string | null; wornAt: string | null }>
  refreshRecommendations: (input: TodayRecommendationRefreshInput) => Promise<TodayRecommendationRefreshResult>
  updateHistoryEntry: (input: TodayHistoryUpdateInput) => Promise<{ error: string | null; entry: TodayOotdHistoryEntry | null }>
  deleteHistoryEntry: (input: { ootdId: string }) => Promise<{ error: string | null }>
}) {
  const router = useRouter()
  const [isCityFormOpen, setIsCityFormOpen] = useState(false)
  const [ootdStatus, setOotdStatus] = useState<TodayOotdStatus>(view.ootdStatus)
  const [recommendations, setRecommendations] = useState(view.recommendations)
  const [weatherState, setWeatherState] = useState(view.weatherState)
  const [targetDate, setTargetDate] = useState<TodayTargetDate>(view.targetDate ?? 'today')
  const [scene, setScene] = useState<TodayScene>(view.scene ?? null)
  const [recommendationOffset, setRecommendationOffset] = useState(0)
  const [isRefreshingRecommendations, setIsRefreshingRecommendations] = useState(false)
  const [isFirstLoopDismissed, setIsFirstLoopDismissed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem('ootoday-today-first-loop-dismissed') === '1'
  })
  const [isCityPromptDismissed, setIsCityPromptDismissed] = useState(false)
  const [historyEntries, setHistoryEntries] = useState(view.recentOotdHistory)
  const [recordedRecommendationId, setRecordedRecommendationId] = useState<string | null>(() =>
    getRecordedRecommendationId({
      recommendations: view.recommendations,
      ootdStatus: view.ootdStatus,
      historyEntries: view.recentOotdHistory
    })
  )
  const hasStartedFeedbackLoop = ootdStatus.status === 'recorded' || historyEntries.length > 0

  function dismissFirstLoop() {
    setIsFirstLoopDismissed(true)
    window.localStorage.setItem('ootoday-today-first-loop-dismissed', '1')
  }

  async function saveCity(input: { city: string }) {
    const result = await updateCity(input)

    if (!result.error) {
      setIsCityPromptDismissed(true)
      setIsCityFormOpen(false)
      router.refresh()
    }

    return result
  }

  async function submitTodayOotd(input: TodayOotdFeedbackInput) {
    const result = await submitOotd(input)

    if (!result.error && result.wornAt) {
      setOotdStatus({ status: 'recorded', wornAt: result.wornAt })
      setRecordedRecommendationId(input.recommendation.id)
    }

    return result
  }

  async function handleRefreshRecommendations() {
    setIsRefreshingRecommendations(true)
    const nextOffset = recommendationOffset + 1

    try {
      const result = await refreshRecommendations({ offset: nextOffset, targetDate, scene })
      startTransition(() => {
        setRecommendations(result.recommendations)
        setWeatherState(result.weatherState ?? weatherState)
        setRecommendationOffset(nextOffset)
        setRecordedRecommendationId((current) =>
          current && result.recommendations.some((recommendation) => recommendation.id === current) ? current : null
        )
      })
    } finally {
      setIsRefreshingRecommendations(false)
    }
  }

  async function handleContextChange(nextContext: { targetDate?: TodayTargetDate; scene?: TodayScene }) {
    const nextTargetDate = nextContext.targetDate ?? targetDate
    const nextScene = nextContext.scene === undefined ? scene : nextContext.scene

    if (nextTargetDate === targetDate && nextScene === scene) {
      return
    }

    setIsRefreshingRecommendations(true)

    try {
      const result = await refreshRecommendations({
        offset: 0,
        targetDate: nextTargetDate,
        scene: nextScene
      })
      startTransition(() => {
        setTargetDate(nextTargetDate)
        setScene(nextScene)
        setWeatherState(result.weatherState ?? weatherState)
        setRecommendations(result.recommendations)
        setRecommendationOffset(0)
        setRecordedRecommendationId((current) =>
          current && result.recommendations.some((recommendation) => recommendation.id === current) ? current : null
        )
      })
    } finally {
      setIsRefreshingRecommendations(false)
    }
  }

  async function handleUpdateHistoryEntry(input: TodayHistoryUpdateInput) {
    const result = await updateHistoryEntry(input)

    if (!result.error && result.entry) {
      setHistoryEntries((current) => current.map((entry) => (entry.id === result.entry?.id ? result.entry : entry)))
    }

    return result
  }

  async function handleDeleteHistoryEntry(input: { ootdId: string }) {
    const deletedEntry = historyEntries.find((entry) => entry.id === input.ootdId) ?? null
    const result = await deleteHistoryEntry(input)

    if (!result.error) {
      setHistoryEntries((current) => current.filter((entry) => entry.id !== input.ootdId))

      if (deletedEntry && ootdStatus.status === 'recorded' && isSameCalendarDay(deletedEntry.wornAt, ootdStatus.wornAt)) {
        setOotdStatus({ status: 'not-recorded' })
        setRecordedRecommendationId(null)
      }
    }

    return result
  }

  return (
    <>
      <TodayStatusCard
        city={view.city}
        weatherState={weatherState}
        targetDate={targetDate}
        scene={scene}
        isRefreshing={isRefreshingRecommendations}
        onEditCity={() => setIsCityFormOpen((current) => !current)}
        isCityEditing={isCityFormOpen}
        cityEditor={isCityFormOpen ? (
          <TodayCityForm
            initialCity={view.city ?? ''}
            onSubmit={saveCity}
            onCancel={() => setIsCityFormOpen(false)}
          />
        ) : null}
        onTargetDateChange={(nextTargetDate) => void handleContextChange({ targetDate: nextTargetDate })}
        onSceneChange={(nextScene) => void handleContextChange({ scene: nextScene })}
      />

      {!view.city && !isCityPromptDismissed ? (
        <TodayCityPromptCard />
      ) : null}

      <TodayRecommendationList
        recommendations={recommendations}
        recommendationError={view.recommendationError}
        ootdStatus={ootdStatus}
        recordedRecommendationId={recordedRecommendationId}
        targetDate={targetDate}
        scene={scene}
        submitOotd={submitTodayOotd}
      />

      {!hasStartedFeedbackLoop && !isFirstLoopDismissed ? (
        <section className="rounded-[1.1rem] border border-[var(--color-line)] bg-white/70 px-3 py-3 shadow-[0_10px_22px_rgba(17,14,9,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-dark)]">First loop</p>
              <h2 className="text-base font-semibold leading-6 text-[var(--color-primary)]">先在今天完成第一次推荐闭环</h2>
              <p className="text-sm leading-6 text-[var(--color-neutral-dark)]">选一套最接近今天会穿的方案并评分，下一轮会更像你。</p>
            </div>
            <button
              type="button"
              aria-label="关闭 first loop 提示"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-white/76 text-base leading-none text-[var(--color-primary)] transition hover:bg-white"
              onClick={dismissFirstLoop}
            >
              ×
            </button>
          </div>
          <FeedbackLink
            surface="today_first_loop"
            label="反馈 Today 问题"
            className="mt-3 inline-flex rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--color-primary)]"
          />
        </section>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <SecondaryButton type="button" onClick={() => void handleRefreshRecommendations()} disabled={isRefreshingRecommendations}>
          {isRefreshingRecommendations ? '正在整理新推荐...' : '换一批推荐'}
        </SecondaryButton>
      </div>

      <TodayOotdHistory entries={historyEntries} onUpdateEntry={handleUpdateHistoryEntry} onDeleteEntry={handleDeleteHistoryEntry} />
    </>
  )
}
