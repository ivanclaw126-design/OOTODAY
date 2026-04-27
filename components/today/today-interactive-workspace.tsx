'use client'

import { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TodayCityForm } from '@/components/today/today-city-form'
import { TodayCityPromptCard } from '@/components/today/today-city-prompt-card'
import { TodayContextBar } from '@/components/today/today-context-bar'
import { TodayOotdHistory } from '@/components/today/today-ootd-history'
import { TodayRecommendationList } from '@/components/today/today-recommendation-list'
import { SecondaryButton } from '@/components/ui/button'
import { buildOotdNotes } from '@/lib/today/build-ootd-notes'
import type {
  TodayChooseRecommendationInput,
  TodayHistoryUpdateInput,
  TodayOotdHistoryEntry,
  TodayOotdStatus,
  TodayPreChoiceFeedbackInput,
  TodayRecommendation,
  TodayRecommendationRefreshInput,
  TodayRecommendationRefreshResult,
  TodaySlotReplacementInput,
  TodaySlotReplacementResult,
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
  chooseRecommendation,
  undoTodaySelection,
  refreshRecommendations,
  replaceRecommendationSlot,
  submitPreChoiceFeedback,
  recordRecommendationOpened,
  updateHistoryEntry,
  deleteHistoryEntry
}: {
  view: TodayView
  updateCity: (input: { city: string }) => Promise<{ error: string | null }>
  chooseRecommendation: (input: TodayChooseRecommendationInput) => Promise<{ error: string | null; wornAt: string | null }>
  undoTodaySelection: () => Promise<{ error: string | null }>
  refreshRecommendations: (input: TodayRecommendationRefreshInput) => Promise<TodayRecommendationRefreshResult>
  replaceRecommendationSlot: (input: TodaySlotReplacementInput) => Promise<TodaySlotReplacementResult>
  submitPreChoiceFeedback: (input: TodayPreChoiceFeedbackInput) => Promise<{ error: string | null }>
  recordRecommendationOpened: (input: TodayChooseRecommendationInput & { source: 'details' | 'quick_feedback' }) => Promise<{ error: string | null }>
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

  async function chooseTodayRecommendation(input: TodayChooseRecommendationInput) {
    const result = await chooseRecommendation(input)

    if (!result.error && result.wornAt) {
      setOotdStatus({ status: 'recorded', wornAt: result.wornAt })
      setRecordedRecommendationId(input.recommendation.id)
    }

    return result
  }

  async function undoSelection() {
    const result = await undoTodaySelection()

    if (!result.error) {
      setOotdStatus({ status: 'not-recorded' })
      setRecordedRecommendationId(null)
    }

    return result
  }

  async function replaceSlot(input: TodaySlotReplacementInput) {
    const result = await replaceRecommendationSlot(input)

    if (!result.error && result.recommendation) {
      setRecommendations((current) =>
        current.map((recommendation) => recommendation.id === input.recommendation.id ? result.recommendation as TodayRecommendation : recommendation)
      )
    }

    return result
  }

  async function handleRefreshRecommendations() {
    setIsRefreshingRecommendations(true)
    const nextOffset = recommendationOffset + 1

    try {
      const lockedRecommendationIndex = recordedRecommendationId
        ? recommendations.findIndex((recommendation) => recommendation.id === recordedRecommendationId)
        : -1
      const lockedRecommendation = lockedRecommendationIndex >= 0 ? recommendations[lockedRecommendationIndex] ?? null : null
      const result = await refreshRecommendations({
        offset: nextOffset,
        targetDate,
        scene,
        ...(lockedRecommendation ? { lockedRecommendation, lockedRecommendationIndex } : {})
      })
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
      const lockedRecommendationIndex = recordedRecommendationId
        ? recommendations.findIndex((recommendation) => recommendation.id === recordedRecommendationId)
        : -1
      const lockedRecommendation = lockedRecommendationIndex >= 0 ? recommendations[lockedRecommendationIndex] ?? null : null
      const result = await refreshRecommendations({
        offset: 0,
        targetDate: nextTargetDate,
        scene: nextScene,
        ...(lockedRecommendation ? { lockedRecommendation, lockedRecommendationIndex } : {})
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
      <TodayContextBar
        city={view.city}
        weatherState={weatherState}
        targetDate={targetDate}
        scene={scene}
        isRefreshing={isRefreshingRecommendations}
        cityEditor={isCityFormOpen ? (
          <TodayCityForm
            initialCity={view.city ?? ''}
            onSubmit={saveCity}
            onCancel={() => setIsCityFormOpen(false)}
          />
        ) : null}
        onEditCity={() => setIsCityFormOpen((current) => !current)}
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
        weatherState={weatherState}
        targetDate={targetDate}
        scene={scene}
        showFirstLoopHint={!hasStartedFeedbackLoop && !isFirstLoopDismissed}
        onDismissFirstLoopHint={dismissFirstLoop}
        chooseRecommendation={chooseTodayRecommendation}
        undoTodaySelection={undoSelection}
        replaceSlot={replaceSlot}
        submitPreChoiceFeedback={submitPreChoiceFeedback}
        recordOpened={recordRecommendationOpened}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <SecondaryButton type="button" onClick={() => void handleRefreshRecommendations()} disabled={isRefreshingRecommendations}>
          {isRefreshingRecommendations ? '正在整理新推荐...' : '换一批推荐'}
        </SecondaryButton>
      </div>

      <TodayOotdHistory entries={historyEntries} onUpdateEntry={handleUpdateHistoryEntry} onDeleteEntry={handleDeleteHistoryEntry} />
    </>
  )
}
