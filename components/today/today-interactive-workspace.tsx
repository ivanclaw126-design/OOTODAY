'use client'

import { startTransition, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { TodayCityForm } from '@/components/today/today-city-form'
import { TodayCityPromptCard } from '@/components/today/today-city-prompt-card'
import { TodayContextBar } from '@/components/today/today-context-bar'
import { TodayOotdHistory } from '@/components/today/today-ootd-history'
import { TodayRecommendationList } from '@/components/today/today-recommendation-list'
import { SecondaryButton } from '@/components/ui/button'
import { DEFAULT_PREFERENCE_PROFILE } from '@/lib/recommendation/default-weights'
import { buildOotdNotes } from '@/lib/today/build-ootd-notes'
import { getNextContinuationMode, mergeContinuousRecommendations } from '@/lib/today/continuous-refresh'
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
  TodayView,
  TodayWeatherState
} from '@/lib/today/types'

function isSameCalendarDay(left: string, right: string) {
  return new Date(left).toDateString() === new Date(right).toDateString()
}

const FIRST_LOOP_DISMISSED_STORAGE_KEY = 'ootoday-today-first-loop-dismissed'
const FIRST_LOOP_DISMISSED_EVENT = 'ootoday:first-loop-dismissed'
const DAILY_RECOMMENDATION_SEQUENCE_STORAGE_KEY = 'ootoday-today-recommendation-sequence'

type DailyRecommendationSequenceState = {
  dateKey: string
  nextSequence: number
  recommendationSequences: Record<string, number>
  shownRecommendationIds: string[]
}

function subscribeToFirstLoopDismissed(onStoreChange: () => void) {
  window.addEventListener(FIRST_LOOP_DISMISSED_EVENT, onStoreChange)
  window.addEventListener('storage', onStoreChange)

  return () => {
    window.removeEventListener(FIRST_LOOP_DISMISSED_EVENT, onStoreChange)
    window.removeEventListener('storage', onStoreChange)
  }
}

function getFirstLoopDismissedSnapshot() {
  return window.localStorage.getItem(FIRST_LOOP_DISMISSED_STORAGE_KEY) === '1'
}

function getFirstLoopDismissedServerSnapshot() {
  return false
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createDailyRecommendationSequenceState(
  recommendations: TodayRecommendation[],
  dateKey = getLocalDateKey()
): DailyRecommendationSequenceState {
  const recommendationSequences: Record<string, number> = {}
  const shownRecommendationIds: string[] = []

  recommendations.forEach((recommendation, index) => {
    recommendationSequences[recommendation.id] = index + 1
    shownRecommendationIds.push(recommendation.id)
  })

  return {
    dateKey,
    nextSequence: recommendations.length + 1,
    recommendationSequences,
    shownRecommendationIds
  }
}

function getNextSequence(recommendationSequences: Record<string, number>, fallback: number) {
  return Math.max(
    fallback,
    ...Object.values(recommendationSequences).filter((value) => Number.isFinite(value)).map((value) => value + 1)
  )
}

function readDailyRecommendationSequenceState(
  recommendations: TodayRecommendation[]
): DailyRecommendationSequenceState {
  const dateKey = getLocalDateKey()

  if (typeof window === 'undefined') {
    return createDailyRecommendationSequenceState(recommendations, dateKey)
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(DAILY_RECOMMENDATION_SEQUENCE_STORAGE_KEY) ?? 'null') as Partial<DailyRecommendationSequenceState> | null

    if (!parsed || parsed.dateKey !== dateKey || typeof parsed.nextSequence !== 'number' || !parsed.recommendationSequences) {
      return createDailyRecommendationSequenceState(recommendations, dateKey)
    }

    const recommendationSequences = { ...parsed.recommendationSequences }
    const shownRecommendationIds = Array.isArray(parsed.shownRecommendationIds)
      ? parsed.shownRecommendationIds.filter((id): id is string => typeof id === 'string')
      : Object.keys(recommendationSequences)

    return {
      dateKey,
      nextSequence: getNextSequence(recommendationSequences, Math.max(1, parsed.nextSequence)),
      recommendationSequences,
      shownRecommendationIds: [...new Set(shownRecommendationIds)]
    }
  } catch {
    return createDailyRecommendationSequenceState(recommendations, dateKey)
  }
}

function persistDailyRecommendationSequenceState(state: DailyRecommendationSequenceState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(DAILY_RECOMMENDATION_SEQUENCE_STORAGE_KEY, JSON.stringify(state))
}

function assignDailyRecommendationSequences({
  state,
  recommendations,
  forceRecommendationIds = []
}: {
  state: DailyRecommendationSequenceState
  recommendations: TodayRecommendation[]
  forceRecommendationIds?: string[]
}) {
  const nextState: DailyRecommendationSequenceState = {
    dateKey: getLocalDateKey(),
    nextSequence: state.dateKey === getLocalDateKey() ? state.nextSequence : 1,
    recommendationSequences: state.dateKey === getLocalDateKey() ? { ...state.recommendationSequences } : {},
    shownRecommendationIds: state.dateKey === getLocalDateKey() ? [...state.shownRecommendationIds] : []
  }
  const forced = new Set(forceRecommendationIds)
  const shown = new Set(nextState.shownRecommendationIds)
  nextState.nextSequence = getNextSequence(nextState.recommendationSequences, nextState.nextSequence)
  let previousSequence = 0

  recommendations.forEach((recommendation) => {
    const currentSequence = nextState.recommendationSequences[recommendation.id]

    if (!currentSequence || forced.has(recommendation.id) || currentSequence <= previousSequence) {
      nextState.recommendationSequences[recommendation.id] = nextState.nextSequence
      nextState.nextSequence += 1
    }

    previousSequence = nextState.recommendationSequences[recommendation.id]

    if (!shown.has(recommendation.id)) {
      shown.add(recommendation.id)
      nextState.shownRecommendationIds.push(recommendation.id)
    }
  })

  return nextState
}

function getContinuationExcludeRecommendationIds(
  state: DailyRecommendationSequenceState,
  currentRecommendations: TodayRecommendation[]
) {
  return [...new Set([
    ...state.shownRecommendationIds,
    ...currentRecommendations.map((recommendation) => recommendation.id)
  ])]
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
  recordRecommendationExposed,
  getRecentHistory,
  resolveWeather,
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
  recordRecommendationExposed: (input: {
    recommendations: TodayRecommendation[]
    targetDate?: TodayTargetDate
    scene?: TodayScene
    offset?: number
    weatherAvailable?: boolean
  }) => Promise<{ error: string | null }>
  getRecentHistory: () => Promise<{ error: string | null; entries: TodayOotdHistoryEntry[] }>
  resolveWeather: (input: { targetDate?: TodayTargetDate }) => Promise<{ error: string | null; weatherState: TodayWeatherState }>
  updateHistoryEntry: (input: TodayHistoryUpdateInput) => Promise<{ error: string | null; entry: TodayOotdHistoryEntry | null }>
  deleteHistoryEntry: (input: { ootdId: string }) => Promise<{ error: string | null }>
}) {
  const router = useRouter()
  const [isCityFormOpen, setIsCityFormOpen] = useState(false)
  const [ootdStatus, setOotdStatus] = useState<TodayOotdStatus>(view.ootdStatus)
  const [recommendations, setRecommendations] = useState(view.recommendations)
  const [recommendationSequenceState, setRecommendationSequenceState] = useState(() =>
    createDailyRecommendationSequenceState(view.recommendations)
  )
  const [weatherState, setWeatherState] = useState(view.weatherState)
  const [targetDate, setTargetDate] = useState<TodayTargetDate>(view.targetDate ?? 'today')
  const [scene, setScene] = useState<TodayScene>(view.scene ?? null)
  const [recommendationOffset, setRecommendationOffset] = useState(0)
  const [isRefreshingRecommendations, setIsRefreshingRecommendations] = useState(false)
  const [isContinuingRecommendations, setIsContinuingRecommendations] = useState(false)
  const [continuousRefreshCount, setContinuousRefreshCount] = useState(0)
  const isFirstLoopDismissed = useSyncExternalStore(
    subscribeToFirstLoopDismissed,
    getFirstLoopDismissedSnapshot,
    getFirstLoopDismissedServerSnapshot
  )
  const [isCityPromptDismissed, setIsCityPromptDismissed] = useState(false)
  const [historyEntries, setHistoryEntries] = useState(view.recentOotdHistory)
  const [recordedRecommendationId, setRecordedRecommendationId] = useState<string | null>(() =>
    getRecordedRecommendationId({
      recommendations: view.recommendations,
      ootdStatus: view.ootdStatus,
      historyEntries: view.recentOotdHistory
    })
  )
  const initialRecommendationsRef = useRef(view.recommendations)
  const latestRecommendationsRef = useRef(recommendations)
  const latestRecordedRecommendationIdRef = useRef(recordedRecommendationId)
  const latestRecommendationSequenceStateRef = useRef(recommendationSequenceState)
  const isContinuationRequestInFlightRef = useRef(false)
  const exposedRecommendationIdsRef = useRef(new Set<string>())
  const weatherResolutionKeyRef = useRef<string | null>(null)
  const hasStartedFeedbackLoop = ootdStatus.status === 'recorded' || historyEntries.length > 0
  const continuousRefresh = view.continuousRefresh ?? {
    enabled: true,
    exploration: DEFAULT_PREFERENCE_PROFILE.exploration
  }
  const continuationMode = getNextContinuationMode({
    refreshCount: continuousRefreshCount,
    exploration: continuousRefresh.exploration
  })

  useEffect(() => {
    latestRecommendationsRef.current = recommendations
  }, [recommendations])

  useEffect(() => {
    const pendingRecommendations = recommendations.filter((recommendation) => !exposedRecommendationIdsRef.current.has(recommendation.id))

    if (pendingRecommendations.length === 0) {
      return
    }

    pendingRecommendations.forEach((recommendation) => exposedRecommendationIdsRef.current.add(recommendation.id))
    void recordRecommendationExposed({
      recommendations: pendingRecommendations,
      targetDate,
      scene,
      offset: recommendationOffset,
      weatherAvailable: weatherState.status === 'ready'
    })
  }, [recordRecommendationExposed, recommendations, targetDate, scene, recommendationOffset, weatherState.status])

  useEffect(() => {
    if (!view.recentOotdHistoryDeferred) {
      return
    }

    let isCancelled = false

    void getRecentHistory().then((result) => {
      if (!isCancelled && !result.error) {
        setHistoryEntries(result.entries)

        const nextRecordedRecommendationId = getRecordedRecommendationId({
          recommendations: latestRecommendationsRef.current,
          ootdStatus,
          historyEntries: result.entries
        })

        if (nextRecordedRecommendationId) {
          latestRecordedRecommendationIdRef.current = nextRecordedRecommendationId
          setRecordedRecommendationId(nextRecordedRecommendationId)
        }
      }
    })

    return () => {
      isCancelled = true
    }
  }, [getRecentHistory, ootdStatus, view.recentOotdHistoryDeferred])

  useEffect(() => {
    if (!view.city || weatherState.status === 'ready') {
      return
    }

    const key = `${view.city}:${targetDate}`

    if (weatherResolutionKeyRef.current === key) {
      return
    }

    weatherResolutionKeyRef.current = key
    let isCancelled = false
    const handle = window.setTimeout(() => {
      void resolveWeather({ targetDate }).then((result) => {
        if (!isCancelled && !result.error && result.weatherState.status === 'ready') {
          setWeatherState(result.weatherState)
        }
      })
    }, 300)

    return () => {
      isCancelled = true
      window.clearTimeout(handle)
    }
  }, [resolveWeather, targetDate, view.city, weatherState.status])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setRecommendationSequenceState((current) => {
        const initialRecommendations = initialRecommendationsRef.current
        const persisted = readDailyRecommendationSequenceState(initialRecommendations)
        const nextState = assignDailyRecommendationSequences({
          state: persisted.dateKey === getLocalDateKey() ? persisted : current,
          recommendations: initialRecommendations
        })
        latestRecommendationSequenceStateRef.current = nextState
        persistDailyRecommendationSequenceState(nextState)
        return nextState
      })
    }, 0)

    return () => window.clearTimeout(handle)
  }, [])

  function commitRecommendationSequences(nextRecommendations: TodayRecommendation[], forceRecommendationIds: string[] = []) {
    setRecommendationSequenceState((current) => {
      const nextState = assignDailyRecommendationSequences({
        state: current,
        recommendations: nextRecommendations,
        forceRecommendationIds
      })
      latestRecommendationSequenceStateRef.current = nextState
      persistDailyRecommendationSequenceState(nextState)
      return nextState
    })
  }

  useEffect(() => {
    latestRecordedRecommendationIdRef.current = recordedRecommendationId
  }, [recordedRecommendationId])

  function dismissFirstLoop() {
    window.localStorage.setItem(FIRST_LOOP_DISMISSED_STORAGE_KEY, '1')
    window.dispatchEvent(new Event(FIRST_LOOP_DISMISSED_EVENT))
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
      latestRecordedRecommendationIdRef.current = input.recommendation.id
      setRecordedRecommendationId(input.recommendation.id)
    }

    return result
  }

  async function undoSelection() {
    const result = await undoTodaySelection()

    if (!result.error) {
      setOotdStatus({ status: 'not-recorded' })
      latestRecordedRecommendationIdRef.current = null
      setRecordedRecommendationId(null)
    }

    return result
  }

  async function replaceSlot(input: TodaySlotReplacementInput) {
    const result = await replaceRecommendationSlot(input)

    if (!result.error && result.recommendation) {
      const nextRecommendations = recommendations.map((recommendation) =>
        recommendation.id === input.recommendation.id ? result.recommendation as TodayRecommendation : recommendation
      )

      setRecommendations((current) =>
        current.map((recommendation) => recommendation.id === input.recommendation.id ? result.recommendation as TodayRecommendation : recommendation)
      )
      commitRecommendationSequences(nextRecommendations, [result.recommendation.id])
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
      setWeatherState(result.weatherState ?? weatherState)
      startTransition(() => {
        setRecommendations(result.recommendations)
        commitRecommendationSequences(result.recommendations)
        setRecommendationOffset(nextOffset)
        setContinuousRefreshCount(0)
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

    const previousTargetDate = targetDate
    const previousScene = scene
    const previousWeatherState = weatherState

    setTargetDate(nextTargetDate)
    setScene(nextScene)
    setWeatherState(view.city ? { status: 'unavailable', city: view.city, targetDate: nextTargetDate } : { status: 'not-set', targetDate: nextTargetDate })
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
      setWeatherState(result.weatherState ?? weatherState)
      startTransition(() => {
        setRecommendations(result.recommendations)
        commitRecommendationSequences(result.recommendations)
        setRecommendationOffset(0)
        setContinuousRefreshCount(0)
        setRecordedRecommendationId((current) =>
          current && result.recommendations.some((recommendation) => recommendation.id === current) ? current : null
        )
      })
    } catch (error) {
      setTargetDate(previousTargetDate)
      setScene(previousScene)
      setWeatherState(previousWeatherState)
      throw error
    } finally {
      setIsRefreshingRecommendations(false)
    }
  }

  const handleContinuationCueVisible = useCallback(async () => {
    const currentRecommendations = latestRecommendationsRef.current
    const currentRecordedRecommendationId = latestRecordedRecommendationIdRef.current

    if (
      !continuousRefresh.enabled ||
      isContinuationRequestInFlightRef.current ||
      isContinuingRecommendations ||
      isRefreshingRecommendations ||
      currentRecommendations.length < 3
    ) {
      return
    }

    isContinuationRequestInFlightRef.current = true
    setIsContinuingRecommendations(true)
    const nextOffset = recommendationOffset + 1
    const requestedMode = getNextContinuationMode({
      refreshCount: continuousRefreshCount,
      exploration: continuousRefresh.exploration
    })

    try {
      const result = await refreshRecommendations({
        offset: nextOffset,
        targetDate,
        scene,
        requestedMode,
        excludeRecommendationIds: getContinuationExcludeRecommendationIds(
          latestRecommendationSequenceStateRef.current,
          currentRecommendations
        )
      })
      const nextRecommendation = result.recommendations[0] ?? null

      startTransition(() => {
        const mergedRecommendations = mergeContinuousRecommendations({
          currentRecommendations,
          newRecommendation: nextRecommendation,
          recordedRecommendationId: currentRecordedRecommendationId
        })

        latestRecommendationsRef.current = mergedRecommendations
        setRecommendations(mergedRecommendations)
        commitRecommendationSequences(mergedRecommendations)
        setWeatherState(result.weatherState ?? weatherState)
        setRecommendationOffset(nextOffset)
        setContinuousRefreshCount((current) => current + 1)

        setRecordedRecommendationId((current) =>
          current && mergedRecommendations.some((recommendation) => recommendation.id === current) ? current : null
        )
      })
    } finally {
      isContinuationRequestInFlightRef.current = false
      setIsContinuingRecommendations(false)
    }
  }, [
    continuousRefreshCount,
    isContinuingRecommendations,
    isRefreshingRecommendations,
    recommendationOffset,
    refreshRecommendations,
    scene,
    targetDate,
    continuousRefresh.enabled,
    continuousRefresh.exploration,
    weatherState
  ])

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
        recommendationSequences={recommendationSequenceState.recommendationSequences}
        continuationMode={continuationMode}
        isRefreshing={isRefreshingRecommendations}
        isContinuationLoading={isContinuingRecommendations}
        onContinuationCueVisible={continuousRefresh.enabled ? handleContinuationCueVisible : undefined}
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
